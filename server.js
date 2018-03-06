const https = require('https');
const path = require('path');
const bodyParser = require('body-parser');
const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const MongoStore = require('connect-mongo')(session);
const axios = require('axios');
const passport = require('passport');
const TwitterStrategy = require('passport-twitter').Strategy;
const Event = require('./models/Event');
const PORT = process.env.PORT || 3000;

const app = express();

mongoose.connect(process.env.MONGO_URI);
const db = mongoose.connection;

app.use(session({
    secret: "bars",
    resave: false,
    saveUninitialized: false,
    store: new MongoStore({
        mongooseConnection: db
    })
}))

app.use(express.static(path.join(__dirname, 'client/build')));

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

app.use(passport.initialize());
app.use(passport.session());

passport.use(new TwitterStrategy({
    consumerKey: process.env.CONSUMER_KEY,
    consumerSecret: process.env.CONSUMER_SECRET,
    callbackURL: '/auth/callback',
}, function(token, tokenSecret, profile, done) {
    const user = profile.id;
    done(null, user);
}))

passport.serializeUser(function(user, done) {
    done(null, user);
})

passport.deserializeUser(function(id, done) {
    done(null, id);
})

app.get('/isuser', (req, res) => {
    if(req.session.passport) {
        res.json(true);
    } else {
        res.json(false);
    }
})

app.get('/search', (req, res) => {
    let city;
    if(!req.session.lastSearch && !req.query.city) {
        return res.json(false);
    } else if(!req.query.city) {
        city = req.session.lastSearch;
    } else if(req.query.city) {
        city = req.session.lastSearch = req.query.city;
    }
    if(city && city.indexOf(' ') >= 0) {
        city = city.replace(' ', '%20');
    }

    const headers = {
        "user-key": process.env.ZOMATO_KEY
    }
    const rootPath = 'https://developers.zomato.com/api/v2.1/';
    const searchParams = '?entity_type=city&category=3&count=10&establishment_type=7&entity_id=';
    
    axios.get(`${rootPath}locations?query=${city}`, {headers: headers}).then(response => {
        const location = response.data.location_suggestions;
        if(location.length === 0 || location[0].entity_type !== 'city') {
            return res.json({err: 'City not found.', city: city});
        }
        const city_id = location[0].city_id;
        const city_name = `${location[0].city_name}, ${location[0].country_name}`;
        axios.get(`${rootPath}search${searchParams}${city_id}`, {headers: headers}).then(resp => {
            if(resp.data.restaurants.length === 0) {
                return res.json({err: "No bars available.", city: city_name});
            }
            const json = resp.data.restaurants.map(restaurant => {
                const rest = restaurant.restaurant;
                return {
                    id: rest.id,
                    name: rest.name,
                    url: rest.url,
                    image: rest.featured_image,
                    cuisines: rest.cuisines,
                    going: 0
                }
            })
            return res.json({bars: json, city: city_name});
        })
    })
})

app.get('/going', (req, res, next) => {
    const restID = req.query.id;
    const city = req.query.city;
    const userID = req.session.passport.user;
    if(!req.session.passport) {
        return res.redirect('/auth/twitter');
    }
    Event.findOne({rest: restID}, function(err, event) {
        if(err) next(err);
        if(!event) {
            const newEvent = new Event({
                createdAt: new Date(),
                city: city,
                rest: restID,
                going: [userID]
            });
            newEvent.save(function(err, createdEvent) {
                if(err) next(err);
                return res.json(createdEvent);
            })
        } else if(event.going.includes(userID)) {
            Event.findOneAndUpdate({rest: restID}, 
            { $pull: { "going": userID } },
            {new: true}, function(err, updatedEvent) {
                if(err) next(err);
                return res.json(updatedEvent);
            })
        } else {
            Event.findOneAndUpdate({rest: restID}, 
            { $push: { "going": userID } },
            {new: true}, function(err, updatedEvent) {
                if(err) next(err);
                return res.json(updatedEvent);
            })
        }
    })
})

app.get('/updateGoing', (req, res, next) => {
    const city = req.query.city;
    Event.find({city: city}, function(err, bars) {
        if(err) next(err);
        res.json(bars);
    })
})

app.get('/auth/twitter', passport.authenticate('twitter'));

app.get('/auth/callback', passport.authenticate('twitter', {
    successRedirect: '/',
    failureRedirect: '/'
}));

app.get('/', (req, res) => {
    console.log('home page');
    res.sendFile(path.join(__dirname, "client/build/index.html"));
})

app.use(function(err, req, res, next) {
    console.log(err.message);
    res.send(err.status + ' ' + err.message);
})

app.listen(PORT, () => console.log(`App running on port ${PORT}`));