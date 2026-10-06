//! Test-only public fixture helpers. No home discovery, title index, CLI or network.
use crate::types::Msg;
use serde_json::{json, Map, Value};
use std::{fs, path::PathBuf};

struct FixtureDir(PathBuf);
impl Drop for FixtureDir {
    fn drop(&mut self) {
        // Also remove our unique scratch directory when a parser assertion panics.
        let _ = fs::remove_dir_all(&self.0);
    }
}

pub(super) fn with_fixture<T>(contents: &str, parse: impl FnOnce(&str) -> T) -> T {
    let path = std::env::temp_dir().join(format!("sv-docs-fixture-{}", uuid::Uuid::new_v4()));
    fs::create_dir(&path).expect("create isolated fixture directory");
    // Install cleanup only after successfully creating a directory we own.
    let dir = FixtureDir(path);
    let path = dir.0.join("synthetic.jsonl");
    fs::write(&path, contents).expect("write public synthetic fixture");
    let result = parse(path.to_str().expect("UTF-8 fixture path"));
    assert_eq!(
        fs::read_to_string(&path).unwrap(),
        contents,
        "parser must not rewrite fixture"
    );
    assert_eq!(
        fs::read_dir(&dir.0).unwrap().count(),
        1,
        "parser must not add scratch files"
    );
    fs::remove_dir_all(&dir.0).expect("clean isolated fixture directory");
    result
}

pub(super) fn assert_expected(agent: &str, msgs: &[Msg]) {
    let expected: Value = serde_json::from_str(include_str!(
        "../../../site-docs/public/examples/adapter-expected.json"
    ))
    .expect("public parser expectation manifest");
    let actual: Vec<Value> = msgs
        .iter()
        .map(|msg| {
            let blocks: Vec<Value> = msg
                .blocks
                .iter()
                .map(|block| {
                    let mut fields = Map::new();
                    fields.insert("kind".into(), json!(block.kind));
                    for (name, value) in [
                        ("text", &block.text),
                        ("toolName", &block.tool_name),
                        ("toolId", &block.tool_id),
                    ] {
                        if let Some(value) = value {
                            fields.insert(name.into(), json!(value));
                        }
                    }
                    if let Some(input) = &block.tool_input {
                        fields.insert(
                            "toolInput".into(),
                            serde_json::from_str(input).unwrap_or_else(|_| json!(input)),
                        );
                    }
                    if block.kind == "tool_result" {
                        fields.insert("isError".into(), json!(block.is_error));
                    }
                    Value::Object(fields)
                })
                .collect();
            json!({"role": msg.role, "blocks": blocks})
        })
        .collect();
    assert_eq!(
        json!(actual),
        expected[agent],
        "{agent} public fixture projection"
    );
}
