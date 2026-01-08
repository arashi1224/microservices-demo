const express = require('express');
const db = require('./db'); // Connect to the Postgres DB module
const app = express();

app.get('/unsubscribe', async (req, res) => {
  const email = req.query.email;

  if (!email) {
    return res.status(400).send('Error: Invalid unsubscribe link (missing email).');
  }

  try {
    console.log(`🔌 Received unsubscribe request for: ${email}`);

    // Call the database function defined in db.js
    const success = await db.deactivateSubscriber(email);

    if (!success) {
      // User wasn't found in the database or was already inactive
      return res.send(`
        <h1>Message</h1>
        <p>The address <b>${email}</b> was not found or is already unsubscribed.</p>
      `);
    }

    // Success
    res.send(`
      <h1>Goodbye!</h1>
      <p><b>${email}</b> has been successfully unsubscribed from the newsletter.</p>
    `);

  } catch (err) {
    console.error('❌ Unsubscribe error:', err);
    res.status(500).send('Internal Server Error');
  }
});

module.exports = app;