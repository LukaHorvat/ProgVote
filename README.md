ProgVote
========

A very simple web app for voting.

Features
--------
Users can add new options.
Users can vote on existing options.
Options are sorted by vote count (on reload).
Votes are IP throttled.

How to run
----------
Get mongodb. Run it on :27017. You might need to adjust the index.ts file so you can connect to your db.

    npm install
    tsc index.ts --module commonjs
    node index.js
    
Then open http://localhost:8442

Screenshot
----------
![SS](http://i.imgur.com/sMU5f1x.png)
