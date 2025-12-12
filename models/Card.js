const { getDatabase } = require('../database/init');

class Card {
    constructor() {
        this.db = getDatabase();
    }

    // Get all cards with their tags
    async getAllCards() {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    c.*,
                    GROUP_CONCAT(t.name) as tags
                FROM cards c
                LEFT JOIN tags t ON c.id = t.card_id
                WHERE c.completed_at IS NULL OR date(c.completed_at) = date('now')
                GROUP BY c.id
                ORDER BY c.created_at DESC
            `;
            
            this.db.all(query, [], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    // Process tags into array
                    const cards = rows.map(row => ({
                        ...row,
                        tags: row.tags ? row.tags.split(',') : []
                    }));
                    resolve(cards);
                }
            });
        });
    }

    // Get card by ID with tags and comments
    async getCardById(id) {
        return new Promise((resolve, reject) => {
            const cardQuery = `SELECT * FROM cards WHERE id = ?`;
            const tagsQuery = `SELECT name FROM tags WHERE card_id = ?`;
            const commentsQuery = `SELECT * FROM comments WHERE card_id = ? ORDER BY created_at DESC`;
            
            this.db.get(cardQuery, [id], (err, card) => {
                if (err) {
                    reject(err);
                    return;
                }
                if (!card) {
                    resolve(null);
                    return;
                }

                // Get tags
                this.db.all(tagsQuery, [id], (err, tagRows) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    
                    card.tags = tagRows.map(row => row.name);
                    
                    // Get comments
                    this.db.all(commentsQuery, [id], (err, comments) => {
                        if (err) {
                            reject(err);
                        } else {
                            card.comments = comments;
                            resolve(card);
                        }
                    });
                });
            });
        });
    }

    // Create new card
    async createCard(cardData) {
        return new Promise((resolve, reject) => {
            const { title, description, column_name, due_date, tags } = cardData;
            
            const query = `
                INSERT INTO cards (title, description, column_name, due_date)
                VALUES (?, ?, ?, ?)
            `;
            
            this.db.run(query, [title, description || '', column_name || 'todo', due_date], function(err) {
                if (err) {
                    reject(err);
                } else {
                    const cardId = this.lastID;
                    
                    // Insert tags if provided
                    if (tags && tags.length > 0) {
                        const tagPromises = tags.map(tagName => 
                            new Promise((resolve, reject) => {
                                const tagQuery = `INSERT INTO tags (card_id, name) VALUES (?, ?)`;
                                this.db.run(tagQuery, [cardId, tagName], (err) => {
                                    if (err) reject(err);
                                    else resolve();
                                });
                            })
                        );
                        
                        Promise.all(tagPromises)
                            .then(() => resolve({ id: cardId, ...cardData }))
                            .catch(reject);
                    } else {
                        resolve({ id: cardId, ...cardData });
                    }
                }
            });
        });
    }

    // Update card
    async updateCard(id, cardData) {
        return new Promise((resolve, reject) => {
            const { title, description, column_name, due_date, tags } = cardData;
            
            // Update completed_at when moving to done column
            let completedAt = null;
            if (column_name === 'done') {
                completedAt = new Date().toISOString();
            }
            
            const query = `
                UPDATE cards 
                SET title = ?, description = ?, column_name = ?, due_date = ?, 
                    updated_at = CURRENT_TIMESTAMP, completed_at = ?
                WHERE id = ?
            `;
            
            this.db.run(query, [title, description, column_name, due_date, completedAt, id], (err) => {
                if (err) {
                    reject(err);
                } else {
                    // Update tags
                    this.updateCardTags(id, tags)
                        .then(() => resolve({ id, ...cardData }))
                        .catch(reject);
                }
            });
        });
    }

    // Update card tags
    async updateCardTags(cardId, tags) {
        return new Promise((resolve, reject) => {
            // First delete existing tags
            this.db.run(`DELETE FROM tags WHERE card_id = ?`, [cardId], (err) => {
                if (err) {
                    reject(err);
                    return;
                }
                
                // Insert new tags
                if (tags && tags.length > 0) {
                    const tagPromises = tags.map(tagName => 
                        new Promise((resolve, reject) => {
                            const query = `INSERT INTO tags (card_id, name) VALUES (?, ?)`;
                            this.db.run(query, [cardId, tagName], (err) => {
                                if (err) reject(err);
                                else resolve();
                            });
                        })
                    );
                    
                    Promise.all(tagPromises)
                        .then(() => resolve())
                        .catch(reject);
                } else {
                    resolve();
                }
            });
        });
    }

    // Delete card
    async deleteCard(id) {
        return new Promise((resolve, reject) => {
            // SQLite will handle cascading deletes for tags and comments
            const query = `DELETE FROM cards WHERE id = ?`;
            
            this.db.run(query, [id], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ deletedCount: this.changes });
                }
            });
        });
    }

    // Move card to different column
    async moveCard(id, newColumn) {
        return new Promise((resolve, reject) => {
            let completedAt = null;
            if (newColumn === 'done') {
                completedAt = new Date().toISOString();
            }
            
            const query = `
                UPDATE cards 
                SET column_name = ?, updated_at = CURRENT_TIMESTAMP, completed_at = ?
                WHERE id = ?
            `;
            
            this.db.run(query, [newColumn, completedAt, id], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ id, column: newColumn, changes: this.changes });
                }
            });
        });
    }

    // Get completed cards for history
    async getHistoryCards(date = null) {
        return new Promise((resolve, reject) => {
            let query = `
                SELECT 
                    c.*,
                    GROUP_CONCAT(t.name) as tags
                FROM cards c
                LEFT JOIN tags t ON c.id = t.card_id
                WHERE c.completed_at IS NOT NULL
            `;
            
            let params = [];
            if (date) {
                query += ` AND date(c.completed_at) = date(?)`;
                params.push(date);
            }
            
            query += ` GROUP BY c.id ORDER BY c.completed_at DESC`;
            
            this.db.all(query, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    const cards = rows.map(row => ({
                        ...row,
                        tags: row.tags ? row.tags.split(',') : []
                    }));
                    resolve(cards);
                }
            });
        });
    }
}

module.exports = Card;