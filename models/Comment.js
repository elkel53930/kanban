const { getDatabase } = require('../database/init');

class Comment {
    constructor() {
        this.db = getDatabase();
    }

    // Get comments for a specific card
    async getCommentsByCardId(cardId) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT * FROM comments 
                WHERE card_id = ? 
                ORDER BY created_at DESC
            `;
            
            this.db.all(query, [cardId], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    // Create new comment
    async createComment(cardId, content) {
        return new Promise((resolve, reject) => {
            const query = `
                INSERT INTO comments (card_id, content)
                VALUES (?, ?)
            `;
            
            this.db.run(query, [cardId, content], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({
                        id: this.lastID,
                        card_id: cardId,
                        content: content,
                        created_at: new Date().toISOString()
                    });
                }
            });
        });
    }

    // Update comment
    async updateComment(id, content) {
        return new Promise((resolve, reject) => {
            const query = `
                UPDATE comments 
                SET content = ?
                WHERE id = ?
            `;
            
            this.db.run(query, [content, id], function(err) {
                if (err) {
                    reject(err);
                } else {
                    if (this.changes === 0) {
                        reject(new Error('Comment not found'));
                    } else {
                        resolve({ id, content, changes: this.changes });
                    }
                }
            });
        });
    }

    // Delete comment
    async deleteComment(id) {
        return new Promise((resolve, reject) => {
            const query = `DELETE FROM comments WHERE id = ?`;
            
            this.db.run(query, [id], function(err) {
                if (err) {
                    reject(err);
                } else {
                    if (this.changes === 0) {
                        reject(new Error('Comment not found'));
                    } else {
                        resolve({ deletedCount: this.changes });
                    }
                }
            });
        });
    }

    // Delete all comments for a card
    async deleteCommentsByCardId(cardId) {
        return new Promise((resolve, reject) => {
            const query = `DELETE FROM comments WHERE card_id = ?`;
            
            this.db.run(query, [cardId], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ deletedCount: this.changes });
                }
            });
        });
    }
}

module.exports = Comment;