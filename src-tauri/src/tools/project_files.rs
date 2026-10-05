//! 项目目录内的轻量文件编辑读写。所有路径都在后端重新限定到项目根目录，
//! 文件列表不跟随软链，写入前以文件 revision 防止覆盖外部修改。

use std::io::Read;
use std::path::{Component, Path, PathBuf};

use super::files::{FileRev, SkillFileText};
use crate::util;
use regex::RegexBuilder;

const MAX_EDIT_BYTES: u64 = 1024 * 1024;
const MAX_FILES: usize = 5_000;
const MAX_DEPTH: usize = 16;
const MAX_SEARCH_BYTES: u64 = 32 * 1024 * 1024;
const MAX_SEARCH_RESULTS: usize = 1_000;
const SKIP_DIRS: &[&str] = &[
    ".git",
    "node_modules",
    "target",
    "dist",
    "build",
    ".next",
    ".nuxt",
    ".venv",
    "venv",
    "vendor",
    "coverage",
    "Pods",
];

#[derive(Debug, Clone, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectFileList {
    pub files: Vec<ProjectEditorEntry>,
    pub truncated: bool,
}

#[derive(Debug, Clone, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectEditorEntry {
    pub path: String,
    pub bytes: u64,
    pub is_dir: bool,
}

#[derive(Debug, Clone, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectSearchOptions {
    pub cwd: String,
    pub query: String,
    pub case_sensitive: bool,
    pub whole_word: bool,
    pub regex: bool,
    pub include: String,
    pub exclude: String,
}

#[derive(Debug, Clone, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectSearchMatch {
    pub path: String,
    pub line_number: usize,
    pub line: String,
}

#[derive(Debug, Clone, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectSearchResults {
    pub matches: Vec<ProjectSearchMatch>,
    pub files_searched: usize,
    pub truncated: bool,
}

fn project_root(cwd: &str) -> Result<PathBuf, String> {
    let root = Path::new(cwd)
        .canonicalize()
        .map_err(|e| format!("Cannot open project {cwd}: {e}"))?;
    if !root.is_dir() {
        return Err(format!("{cwd} is not a directory"));
    }
    Ok(root)
}

fn scoped(root: &Path, rel: &str) -> Result<PathBuf, String> {
    let relative = Path::new(rel);
    if rel.is_empty() || relative.is_absolute() {
        return Err(format!("Bad project file path: {rel}"));
    }
    if relative
        .components()
        .any(|part| !matches!(part, Component::Normal(_)))
    {
        return Err(format!("Bad project file path: {rel}"));
    }
    let path = root.join(relative);
    let parent = path
        .parent()
        .ok_or_else(|| format!("Bad project file path: {rel}"))?;
    let real_parent = parent
        .canonicalize()
        .map_err(|e| format!("Cannot resolve {rel}: {e}"))?;
    if !real_parent.starts_with(root) {
        return Err(format!("{rel} escapes the project directory"));
    }
    Ok(path)
}

fn revision(path: &Path) -> FileRev {
    let Ok(meta) = std::fs::symlink_metadata(path) else {
        return FileRev {
            exists: false,
            bytes: 0,
            modified_ms: None,
        };
    };
    FileRev {
        exists: true,
        bytes: meta.len(),
        modified_ms: meta
            .modified()
            .ok()
            .and_then(|time| time.duration_since(std::time::UNIX_EPOCH).ok())
            .map(|duration| duration.as_millis() as i64),
    }
}

fn walk(
    root: &Path,
    dir: &Path,
    depth: usize,
    out: &mut Vec<ProjectEditorEntry>,
    truncated: &mut bool,
) {
    if depth >= MAX_DEPTH || out.len() >= MAX_FILES {
        *truncated = true;
        return;
    }
    let Ok(entries) = std::fs::read_dir(dir) else {
        *truncated = true;
        return;
    };
    for entry in entries.flatten() {
        if out.len() >= MAX_FILES {
            *truncated = true;
            break;
        }
        let path = entry.path();
        let Ok(meta) = std::fs::symlink_metadata(&path) else {
            continue;
        };
        if meta.file_type().is_symlink() {
            continue;
        }
        let name = entry.file_name().to_string_lossy().to_string();
        if name == ".DS_Store" {
            continue;
        }
        if meta.is_dir() {
            if !SKIP_DIRS.contains(&name.as_str()) {
                let rel = path
                    .strip_prefix(root)
                    .unwrap_or(&path)
                    .to_string_lossy()
                    .replace('\\', "/");
                out.push(ProjectEditorEntry {
                    path: rel,
                    bytes: 0,
                    is_dir: true,
                });
                walk(root, &path, depth + 1, out, truncated);
            }
        } else if meta.is_file() {
            let rel = path
                .strip_prefix(root)
                .unwrap_or(&path)
                .to_string_lossy()
                .replace('\\', "/");
            out.push(ProjectEditorEntry {
                path: rel,
                bytes: meta.len(),
                is_dir: false,
            });
        }
    }
}

pub fn list(cwd: &str) -> Result<ProjectFileList, String> {
    let root = project_root(cwd)?;
    let mut files = Vec::new();
    let mut truncated = false;
    walk(&root, &root, 0, &mut files, &mut truncated);
    files.sort_by(|a: &ProjectEditorEntry, b| a.path.cmp(&b.path));
    Ok(ProjectFileList { files, truncated })
}

pub fn read(cwd: &str, rel: &str) -> Result<SkillFileText, String> {
    let root = project_root(cwd)?;
    let path = scoped(&root, rel)?;
    let meta = std::fs::symlink_metadata(&path).map_err(|e| format!("Cannot read {rel}: {e}"))?;
    if !meta.is_file() || meta.file_type().is_symlink() {
        return Err(format!("{rel} is not a regular file"));
    }
    let bytes = meta.len();
    let rev = revision(&path);
    let mut raw = Vec::new();
    std::fs::File::open(&path)
        .and_then(|file| file.take(MAX_EDIT_BYTES + 1).read_to_end(&mut raw))
        .map_err(|e| format!("Cannot read {rel}: {e}"))?;
    let binary = raw[..raw.len().min(8 * 1024)].contains(&0);
    let truncated = bytes > MAX_EDIT_BYTES;
    if truncated {
        raw.truncate(MAX_EDIT_BYTES as usize);
    }
    let text = if binary {
        String::new()
    } else {
        String::from_utf8_lossy(&raw).into_owned()
    };
    Ok(SkillFileText {
        rel: rel.to_string(),
        text,
        bytes,
        binary,
        truncated,
        rev,
    })
}

fn glob_regex(pattern: &str) -> Result<regex::Regex, String> {
    let mut source = String::from("^");
    let mut chars = pattern.chars().peekable();
    while let Some(ch) = chars.next() {
        match ch {
            '*' if chars.peek() == Some(&'*') => {
                chars.next();
                if chars.peek() == Some(&'/') {
                    chars.next();
                    source.push_str("(?:.*/)?");
                } else {
                    source.push_str(".*");
                }
            }
            '*' => source.push_str("[^/]*"),
            '?' => source.push_str("[^/]"),
            other => source.push_str(&regex::escape(&other.to_string())),
        }
    }
    source.push('$');
    regex::Regex::new(&source).map_err(|e| format!("Invalid file pattern {pattern}: {e}"))
}

fn pattern_list(raw: &str) -> Result<Vec<regex::Regex>, String> {
    raw.split([',', '\n'])
        .map(str::trim)
        .filter(|item| !item.is_empty())
        .map(glob_regex)
        .collect()
}

pub fn search(options: &ProjectSearchOptions) -> Result<ProjectSearchResults, String> {
    let query = options.query.trim();
    if query.is_empty() {
        return Ok(ProjectSearchResults {
            matches: Vec::new(),
            files_searched: 0,
            truncated: false,
        });
    }
    let root = project_root(&options.cwd)?;
    let mut expression = if options.regex {
        query.to_string()
    } else {
        regex::escape(query)
    };
    if options.whole_word {
        expression = format!(r"\b(?:{expression})\b");
    }
    let matcher = RegexBuilder::new(&expression)
        .case_insensitive(!options.case_sensitive)
        .build()
        .map_err(|e| format!("Invalid search expression: {e}"))?;
    let includes = pattern_list(&options.include)?;
    let excludes = pattern_list(&options.exclude)?;
    let listed = list(&options.cwd)?;
    let files = listed.files;
    let mut truncated = listed.truncated;
    let mut output = Vec::new();
    let mut files_searched = 0;
    let mut bytes_scanned = 0u64;

    for file in files {
        if file.is_dir {
            continue;
        }
        if !includes.is_empty() && !includes.iter().any(|pattern| pattern.is_match(&file.path)) {
            continue;
        }
        if excludes.iter().any(|pattern| pattern.is_match(&file.path)) {
            continue;
        }
        if file.bytes > MAX_EDIT_BYTES
            || bytes_scanned.saturating_add(file.bytes) > MAX_SEARCH_BYTES
        {
            truncated = true;
            continue;
        }
        let path = scoped(&root, &file.path)?;
        let raw = std::fs::read(&path).map_err(|e| format!("Cannot read {}: {e}", file.path))?;
        if raw.contains(&0) {
            continue;
        }
        bytes_scanned = bytes_scanned.saturating_add(raw.len() as u64);
        files_searched += 1;
        let content = String::from_utf8_lossy(&raw);
        for (index, line) in content.lines().enumerate() {
            if matcher.is_match(line) {
                let excerpt: String = line.chars().take(500).collect();
                output.push(ProjectSearchMatch {
                    path: file.path.clone(),
                    line_number: index + 1,
                    line: excerpt,
                });
                if output.len() >= MAX_SEARCH_RESULTS {
                    truncated = true;
                    break;
                }
            }
        }
        if output.len() >= MAX_SEARCH_RESULTS || bytes_scanned >= MAX_SEARCH_BYTES {
            truncated = true;
            break;
        }
    }
    Ok(ProjectSearchResults {
        matches: output,
        files_searched,
        truncated,
    })
}

pub fn create(cwd: &str, rel: &str, directory: bool) -> Result<(), String> {
    let root = project_root(cwd)?;
    let path = scoped(&root, rel)?;
    if path.exists() {
        return Err(format!("{rel} already exists"));
    }
    if directory {
        std::fs::create_dir(&path).map_err(|e| format!("Cannot create directory {rel}: {e}"))
    } else {
        std::fs::OpenOptions::new()
            .write(true)
            .create_new(true)
            .open(&path)
            .map(|_| ())
            .map_err(|e| format!("Cannot create file {rel}: {e}"))
    }
}

pub fn delete(cwd: &str, rel: &str) -> Result<(), String> {
    let root = project_root(cwd)?;
    let path = scoped(&root, rel)?;
    let meta = std::fs::symlink_metadata(&path).map_err(|e| format!("Cannot delete {rel}: {e}"))?;
    if meta.file_type().is_symlink() {
        return Err(format!("Refusing to delete symlink {rel}"));
    }
    if meta.is_dir() {
        std::fs::remove_dir_all(&path).map_err(|e| format!("Cannot delete directory {rel}: {e}"))
    } else if meta.is_file() {
        std::fs::remove_file(&path).map_err(|e| format!("Cannot delete file {rel}: {e}"))
    } else {
        Err(format!("{rel} is not a regular file or directory"))
    }
}

pub fn write(cwd: &str, rel: &str, text: &str, expected: &FileRev) -> Result<FileRev, String> {
    let root = project_root(cwd)?;
    let path = scoped(&root, rel)?;
    let meta = std::fs::symlink_metadata(&path).map_err(|e| format!("Cannot write {rel}: {e}"))?;
    if !meta.is_file() || meta.file_type().is_symlink() {
        return Err(format!("{rel} is not a regular file"));
    }
    let current = revision(&path);
    if current != *expected {
        return Err(format!(
            "{rel} changed outside the editor — reload it before saving"
        ));
    }
    if current.bytes > MAX_EDIT_BYTES {
        return Err(format!("{rel} is too large to edit in place"));
    }
    let guard = util::file_revision(&path)?;
    util::atomic_write_file(&path, text.as_bytes(), &guard, rel)?;
    Ok(revision(&path))
}

#[tauri::command(async)]
pub fn project_list_files(cwd: String) -> Result<ProjectFileList, String> {
    list(&cwd)
}

#[tauri::command(async)]
pub fn project_read_file(cwd: String, rel: String) -> Result<SkillFileText, String> {
    read(&cwd, &rel)
}

#[tauri::command(async)]
pub fn project_write_file(
    cwd: String,
    rel: String,
    text: String,
    rev: FileRev,
) -> Result<FileRev, String> {
    write(&cwd, &rel, &text, &rev)
}

#[tauri::command(async)]
pub fn project_create_file(cwd: String, rel: String, directory: bool) -> Result<(), String> {
    create(&cwd, &rel, directory)
}

#[tauri::command(async)]
pub fn project_delete_path(cwd: String, rel: String) -> Result<(), String> {
    delete(&cwd, &rel)
}

#[tauri::command(async)]
pub fn project_search_files(options: ProjectSearchOptions) -> Result<ProjectSearchResults, String> {
    search(&options)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn project_search_matches_whole_words_and_file_globs() {
        let tmp =
            std::env::temp_dir().join(format!("project-editor-search-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&tmp);
        std::fs::create_dir_all(tmp.join("src")).unwrap();
        std::fs::write(tmp.join("src/main.rs"), "Foo\nfoobar\nfoo\n").unwrap();
        std::fs::write(tmp.join("README.md"), "foo\n").unwrap();
        let options = ProjectSearchOptions {
            cwd: tmp.to_string_lossy().to_string(),
            query: "foo".to_string(),
            case_sensitive: false,
            whole_word: true,
            regex: false,
            include: "**/*.rs".to_string(),
            exclude: String::new(),
        };
        let results = search(&options).unwrap();
        assert_eq!(results.matches.len(), 2);
        assert!(results
            .matches
            .iter()
            .all(|item| item.path == "src/main.rs"));
        let _ = std::fs::remove_dir_all(tmp);
    }

    #[test]
    fn project_editor_can_create_files_and_empty_directories() {
        let tmp =
            std::env::temp_dir().join(format!("project-editor-create-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&tmp);
        std::fs::create_dir_all(&tmp).unwrap();
        let cwd = tmp.to_string_lossy().to_string();
        create(&cwd, "src", true).unwrap();
        create(&cwd, "src/main.ts", false).unwrap();
        let listed = list(&cwd).unwrap();
        assert!(listed
            .files
            .iter()
            .any(|item| item.path == "src" && item.is_dir));
        assert!(listed
            .files
            .iter()
            .any(|item| item.path == "src/main.ts" && !item.is_dir));
        assert!(create(&cwd, "../outside", false).is_err());
        let _ = std::fs::remove_dir_all(tmp);
    }

    #[test]
    fn project_editor_deletes_files_and_directories_only_inside_project() {
        let tmp =
            std::env::temp_dir().join(format!("project-editor-delete-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&tmp);
        std::fs::create_dir_all(tmp.join("src/nested")).unwrap();
        std::fs::write(tmp.join("src/main.rs"), "fn main() {}\n").unwrap();
        std::fs::write(tmp.join("src/nested/lib.rs"), "pub fn lib() {}\n").unwrap();
        let cwd = tmp.to_string_lossy().to_string();

        delete(&cwd, "src/main.rs").unwrap();
        assert!(!tmp.join("src/main.rs").exists());
        delete(&cwd, "src").unwrap();
        assert!(!tmp.join("src").exists());
        assert!(delete(&cwd, "../outside").is_err());
        assert!(delete(&cwd, "").is_err());
        let _ = std::fs::remove_dir_all(tmp);
    }

    #[cfg(unix)]
    #[test]
    fn project_editor_refuses_to_delete_symlinks() {
        use std::os::unix::fs::symlink;

        let base =
            std::env::temp_dir().join(format!("project-editor-delete-link-{}", std::process::id()));
        let root = base.join("root");
        let outside = base.join("outside");
        let _ = std::fs::remove_dir_all(&base);
        std::fs::create_dir_all(&root).unwrap();
        std::fs::create_dir_all(&outside).unwrap();
        std::fs::write(outside.join("keep.txt"), "keep").unwrap();
        symlink(&outside, root.join("external")).unwrap();

        assert!(delete(&root.to_string_lossy(), "external").is_err());
        assert!(outside.join("keep.txt").exists());
        let _ = std::fs::remove_dir_all(base);
    }

    #[test]
    fn project_files_list_read_write_and_detect_external_change() {
        let tmp = std::env::temp_dir().join(format!("project-editor-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&tmp);
        std::fs::create_dir_all(tmp.join("src")).unwrap();
        std::fs::write(tmp.join("src/main.rs"), "fn main() {}\n").unwrap();
        let cwd = tmp.to_string_lossy().to_string();
        let listed = list(&cwd).unwrap();
        assert!(listed.files.iter().any(|file| file.path == "src/main.rs"));
        let opened = read(&cwd, "src/main.rs").unwrap();
        assert_eq!(opened.text, "fn main() {}\n");
        let updated = write(&cwd, "src/main.rs", "fn main() { }\n", &opened.rev).unwrap();
        assert!(updated.exists);
        std::fs::write(tmp.join("src/main.rs"), "external change").unwrap();
        assert!(write(&cwd, "src/main.rs", "overwrite", &updated).is_err());
        assert!(read(&cwd, "../outside").is_err());
        let _ = std::fs::remove_dir_all(tmp);
    }
}
