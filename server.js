const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;
const reviewsFile = path.join(__dirname, 'reviews.json');
const discountsFile = path.join(__dirname, 'discounts.json');
const redemptionsFile = path.join(__dirname, 'discount-redemptions.json');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

function readJsonFile(filePath, fallback) {
  if (!fs.existsSync(filePath)) {
    return fallback;
  }

  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    return fallback;
  }
}

function writeJsonFile(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function readReviews() {
  return readJsonFile(reviewsFile, []);
}

function writeReviews(reviews) {
  writeJsonFile(reviewsFile, reviews);
}

function readDiscounts() {
  return readJsonFile(discountsFile, {});
}

function readRedemptions() {
  return readJsonFile(redemptionsFile, []);
}

function writeRedemptions(redemptions) {
  writeJsonFile(redemptionsFile, redemptions);
}

app.get('/api/reviews', (req, res) => {
  res.json(readReviews());
});

app.post('/api/discount/validate', (req, res) => {
  const code = String(req.body.code || '').trim().toUpperCase();
  const email = String(req.body.email || '').trim().toLowerCase();

  if (!code || !email) {
    return res.status(400).json({ valid: false, error: 'Codul și email-ul sunt obligatorii.' });
  }

  const discounts = readDiscounts();
  const discount = discounts[code];
  if (!discount || !discount.active) {
    return res.status(404).json({ valid: false, error: 'Codul nu există sau nu este activ.' });
  }

  const redemptions = readRedemptions();
  const alreadyUsed = redemptions.some((entry) => entry.code === code && entry.email === email);
  if (alreadyUsed) {
    return res.status(409).json({ valid: false, error: 'Acest cod a fost deja folosit pentru acest email.' });
  }

  return res.json({
    valid: true,
    code,
    percent: Number(discount.percent || 0),
    message: `Reducere ${discount.percent}% aplicată.`
  });
});

app.post('/api/discount/redeem', (req, res) => {
  const code = String(req.body.code || '').trim().toUpperCase();
  const email = String(req.body.email || '').trim().toLowerCase();

  if (!code || !email) {
    return res.status(400).json({ valid: false, error: 'Codul și email-ul sunt obligatorii.' });
  }

  const discounts = readDiscounts();
  const discount = discounts[code];
  if (!discount || !discount.active) {
    return res.status(404).json({ valid: false, error: 'Codul nu există sau nu este activ.' });
  }

  const redemptions = readRedemptions();
  const alreadyUsed = redemptions.some((entry) => entry.code === code && entry.email === email);
  if (alreadyUsed) {
    return res.status(409).json({ valid: false, error: 'Acest cod a fost deja folosit pentru acest email.' });
  }

  redemptions.unshift({
    code,
    email,
    usedAt: new Date().toISOString()
  });
  writeRedemptions(redemptions);

  return res.json({
    valid: true,
    code,
    percent: Number(discount.percent || 0)
  });
});

app.post('/api/reviews', (req, res) => {
  const reviews = readReviews();
  const review = {
    id: Date.now().toString(),
    name: req.body.name || 'Anonymous',
    rating: Number(req.body.rating || 5),
    message: req.body.message || '',
    date: new Date().toLocaleDateString('en', { year: 'numeric', month: 'short', day: 'numeric' }),
    images: Array.isArray(req.body.images) ? req.body.images : [],
    status: 'pending'
  };

  reviews.unshift(review);
  writeReviews(reviews);
  res.json(review);
});

app.put('/api/reviews/:id/approve', (req, res) => {
  const reviews = readReviews();
  const review = reviews.find((item) => item.id === req.params.id);

  if (!review) {
    return res.status(404).json({ error: 'Review not found' });
  }

  review.status = 'approved';
  writeReviews(reviews);
  res.json(review);
});

app.delete('/api/reviews/:id', (req, res) => {
  const reviews = readReviews();
  const filteredReviews = reviews.filter((item) => item.id !== req.params.id);

  if (filteredReviews.length === reviews.length) {
    return res.status(404).json({ error: 'Review not found' });
  }

  writeReviews(filteredReviews);
  res.json({ success: true });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
