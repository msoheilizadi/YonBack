const express = require('express');
const router = express.Router();
const Song = require('../models/Song');

router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    const whereClause = category ? { category } : {};
    
    const songs = await Song.findAll({ where: whereClause });
    res.json(songs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const song = await Song.create(req.body);
    res.status(201).json(song);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;