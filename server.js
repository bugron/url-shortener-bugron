'use strict';

const express = require('express');
const mongoist = require('mongoist');
const db = mongoist(process.env.MONGO_URI, { useNewUrlParser: true });
const bodyParser = require('body-parser');
const URL = require('url');
const dns = require('dns');



// const mongoose = require('mongoose');

const cors = require('cors');

const app = express();

// Basic Configuration 
const port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
// mongoose.connect(process.env.MONGOLAB_URI);

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here

app.use('/public', express.static(process.cwd() + '/public'));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

  
// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});

app.get("/api/shorturl/:short_url", async function (req, res) {
  const { short_url } = req.params;
  const [document] = await db.urlshortener.find({ short_url: Number(short_url) });

  if (document && document.original_url) {
    console.log('Redirecting to...', document.original_url);
    res.redirect(document.original_url);
  } else {
    res.status(404).json({ error: 'specified short URL is not found' });
  }
});


app.post("/api/shorturl/new", function (req, res) {
  const { url } = req.body;
  console.log(req.body);

  // Checking if url is a valid URl
  const parsedURL = URL.parse(url);
  if (parsedURL && parsedURL.host) {
    dns.lookup(parsedURL.host, { all: true }, async (err, results) => {
      if (err || !results.length) return res.status(400).json({ error: 'invalid URL' });

      const docCount = await db.urlshortener.count();
      const document = {
        original_url: url,
        short_url: docCount + 1
      };

      const insertResult = await db.urlshortener.insert(document);

      res.json({
        original_url: insertResult.original_url,
        short_url: insertResult.short_url
      });
    });
  } else {
    res.json({ error: 'invalid URL' });
  }
});


app.listen(port, function () {
  console.log('Node.js listening ...');
});