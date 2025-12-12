const express = require('express');
const router = express.Router();
const Card = require('../models/Card');
const Comment = require('../models/Comment');

const cardModel = new Card();
const commentModel = new Comment();

// Cards API endpoints

// GET /api/cards - Get all cards
router.get('/cards', async (req, res) => {
    try {
        const cards = await cardModel.getAllCards();
        res.json(cards);
    } catch (error) {
        console.error('Error fetching cards:', error);
        res.status(500).json({ error: 'Failed to fetch cards' });
    }
});

// GET /api/cards/:id - Get card by ID
router.get('/cards/:id', async (req, res) => {
    try {
        const card = await cardModel.getCardById(req.params.id);
        if (!card) {
            return res.status(404).json({ error: 'Card not found' });
        }
        res.json(card);
    } catch (error) {
        console.error('Error fetching card:', error);
        res.status(500).json({ error: 'Failed to fetch card' });
    }
});

// POST /api/cards - Create new card
router.post('/cards', async (req, res) => {
    try {
        const { title, description, column_name, due_date, tags } = req.body;
        
        if (!title) {
            return res.status(400).json({ error: 'Title is required' });
        }
        
        const card = await cardModel.createCard({
            title,
            description,
            column_name,
            due_date,
            tags
        });
        
        res.status(201).json(card);
    } catch (error) {
        console.error('Error creating card:', error);
        res.status(500).json({ error: 'Failed to create card' });
    }
});

// PUT /api/cards/:id - Update card
router.put('/cards/:id', async (req, res) => {
    try {
        const { title, description, column_name, due_date, tags } = req.body;
        
        const card = await cardModel.updateCard(req.params.id, {
            title,
            description,
            column_name,
            due_date,
            tags
        });
        
        res.json(card);
    } catch (error) {
        console.error('Error updating card:', error);
        res.status(500).json({ error: 'Failed to update card' });
    }
});

// PATCH /api/cards/:id/move - Move card to different column
router.patch('/cards/:id/move', async (req, res) => {
    try {
        const { column } = req.body;
        
        if (!column) {
            return res.status(400).json({ error: 'Column is required' });
        }
        
        const result = await cardModel.moveCard(req.params.id, column);
        res.json(result);
    } catch (error) {
        console.error('Error moving card:', error);
        res.status(500).json({ error: 'Failed to move card' });
    }
});

// DELETE /api/cards/:id - Delete card
router.delete('/cards/:id', async (req, res) => {
    try {
        const result = await cardModel.deleteCard(req.params.id);
        res.json(result);
    } catch (error) {
        console.error('Error deleting card:', error);
        res.status(500).json({ error: 'Failed to delete card' });
    }
});

// GET /api/history - Get completed cards for history
router.get('/history', async (req, res) => {
    try {
        const date = req.query.date || null;
        const cards = await cardModel.getHistoryCards(date);
        res.json(cards);
    } catch (error) {
        console.error('Error fetching history:', error);
        res.status(500).json({ error: 'Failed to fetch history' });
    }
});

// Comments API endpoints

// GET /api/cards/:id/comments - Get comments for a card
router.get('/cards/:id/comments', async (req, res) => {
    try {
        const comments = await commentModel.getCommentsByCardId(req.params.id);
        res.json(comments);
    } catch (error) {
        console.error('Error fetching comments:', error);
        res.status(500).json({ error: 'Failed to fetch comments' });
    }
});

// POST /api/cards/:id/comments - Add comment to card
router.post('/cards/:id/comments', async (req, res) => {
    try {
        const { content } = req.body;
        
        if (!content) {
            return res.status(400).json({ error: 'Content is required' });
        }
        
        const comment = await commentModel.createComment(req.params.id, content);
        res.status(201).json(comment);
    } catch (error) {
        console.error('Error creating comment:', error);
        res.status(500).json({ error: 'Failed to create comment' });
    }
});

// PUT /api/comments/:id - Update comment
router.put('/comments/:id', async (req, res) => {
    try {
        const { content } = req.body;
        
        if (!content) {
            return res.status(400).json({ error: 'Content is required' });
        }
        
        const comment = await commentModel.updateComment(req.params.id, content);
        res.json(comment);
    } catch (error) {
        console.error('Error updating comment:', error);
        if (error.message === 'Comment not found') {
            res.status(404).json({ error: 'Comment not found' });
        } else {
            res.status(500).json({ error: 'Failed to update comment' });
        }
    }
});

// DELETE /api/comments/:id - Delete comment
router.delete('/comments/:id', async (req, res) => {
    try {
        const result = await commentModel.deleteComment(req.params.id);
        res.json(result);
    } catch (error) {
        console.error('Error deleting comment:', error);
        if (error.message === 'Comment not found') {
            res.status(404).json({ error: 'Comment not found' });
        } else {
            res.status(500).json({ error: 'Failed to delete comment' });
        }
    }
});

module.exports = router;