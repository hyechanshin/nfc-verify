const express = require('express');
const router = express.Router();
const Tag = require('../models/Tag');

router.post('/', async (req, res) => {
    try {
        const tag = await Tag.create(req.body);
        res.status(201).json(tag);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
})

router.get('/', async (req, res) => {
    const tags = await Tag.find().sort({ createdAt: -1});
    res.json(tags);
})

module.exports = router;