const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Database initialization
const DB_PATH = path.join(__dirname, 'kanban.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

function initDatabase() {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(DB_PATH, (err) => {
            if (err) {
                console.error('Error opening database:', err);
                reject(err);
                return;
            }
            console.log('Connected to SQLite database');
        });

        // Read and execute schema
        fs.readFile(SCHEMA_PATH, 'utf8', (err, schema) => {
            if (err) {
                console.error('Error reading schema file:', err);
                reject(err);
                return;
            }

            db.exec(schema, (err) => {
                if (err) {
                    console.error('Error creating tables:', err);
                    reject(err);
                    return;
                }
                console.log('Database tables created successfully');
                
                // Insert sample data
                insertSampleData(db, () => {
                    resolve(db);
                });
            });
        });
    });
}

function insertSampleData(db, callback) {
    // Check if cards already exist
    db.get('SELECT COUNT(*) as count FROM cards', (err, row) => {
        if (err) {
            console.error('Error checking existing cards:', err);
            callback();
            return;
        }
        
        // Only insert sample data if no cards exist
        if (row.count > 0) {
            console.log('Cards already exist, skipping sample data insertion');
            callback();
            return;
        }
        
        const insertCard = `
            INSERT INTO cards (title, description, column_name, due_date) 
            VALUES (?, ?, ?, ?)
        `;
        
        const insertTag = `INSERT INTO tags (card_id, name) VALUES (?, ?)`;
        
        // Sample cards
        const sampleCards = [
            {
                title: 'サンプルタスク1',
                description: '# タスク説明\n\nこれはサンプルタスクです。',
                column: 'todo',
                dueDate: '2025-12-15',
                tags: ['重要', 'サンプル']
            },
            {
                title: 'サンプルタスク2',
                description: '## 急ぎのタスク\n\n- 項目1\n- 項目2',
                column: 'today',
                dueDate: null,
                tags: ['急ぎ', '開発']
            }
        ];

        let cardCount = 0;
        sampleCards.forEach((card, index) => {
            db.run(insertCard, [card.title, card.description, card.column, card.dueDate], function(err) {
                if (err) {
                    console.error('Error inserting card:', err);
                    return;
                }
                
                const cardId = this.lastID;
                
                // Insert tags for this card
                let tagCount = 0;
                card.tags.forEach(tagName => {
                    db.run(insertTag, [cardId, tagName], (err) => {
                        if (err) console.error('Error inserting tag:', err);
                        tagCount++;
                        if (tagCount === card.tags.length) {
                            cardCount++;
                            if (cardCount === sampleCards.length) {
                                console.log('Sample data inserted successfully');
                                callback();
                            }
                        }
                    });
                });
            });
        });
    });
}

function getDatabase() {
    return new sqlite3.Database(DB_PATH);
}

module.exports = {
    initDatabase,
    getDatabase
};