-- このファイルに記述されたSQLコマンドが、マイグレーション時に実行されます。
CREATE INDEX idx_entry_date_kana ON user(entry_date, kana);
CREATE INDEX idx_role_id_belong ON department_role_member(role_id, belong);
CREATE INDEX idx_department_id ON department(department_id);
CREATE INDEX idx_user_belong ON department_role_member(user_id, belong);
CREATE INDEX idx_file_id ON file(file_id);

CREATE INDEX idx_office_name ON office(office_id);
CREATE INDEX idx_user_id ON user(user_id);
CREATE INDEX index_match_group ON match_group(match_group_id, status);

CREATE INDEX index_skill_member ON skill_member(skill_id);
CREATE INDEX index_skill ON skill(skill_name);
CREATE INDEX idx_user_goal ON user(goal);
