-- Synthetic query fixture, not an opencode migration or a complete native schema.
-- Load into a NEW temporary database only. No credentials or real conversations.
CREATE TABLE project (id TEXT, worktree TEXT);
CREATE TABLE session (id TEXT, project_id TEXT, parent_id TEXT, title TEXT, cost REAL, time_created INTEGER);
CREATE TABLE message (id TEXT, session_id TEXT, time_created INTEGER, data TEXT);
CREATE TABLE part (message_id TEXT, time_created INTEGER, data TEXT);
INSERT INTO project VALUES ('p', '/synthetic/project');
INSERT INTO session VALUES ('ses_...', 'p', NULL, 'Synthetic session', 1.0, 0);
INSERT INTO session VALUES ('ses_child', 'p', 'ses_...', 'Sub-agent', 2.0, 1000);
INSERT INTO message VALUES ('m', 'ses_...', 0, '{"role":"user"}');
INSERT INTO part VALUES ('m', 0, '{"type":"text","text":"Question"}');
INSERT INTO part VALUES ('m', 1, '{"type":"tool","text":"Not plain text"}');
