var express = require('express');
var router = express.Router();
var expressValidator = require('express-validator');
var passport = require('passport');
const { authenticationMiddleware } = require('./ap');


var bcrypt = require('bcrypt');
const saltRounds = 10;

router.get('/', async(req, res) => {
    console.log(req.user);
    console.log(req.isAuthenticated());
    res.render('home', { title: 'Home' });
});

router.get('/profile', authenticationMiddleware,
    function(req, res) {
        res.render('profile', { title: 'Profile' });
    });

router.get('/login', function(req, res) {
    res.render('login', { title: 'Login' });
});

router.post('/login', passport.authenticate(
    'local', {
        successRedirect: '/profile',
        failureRedirect: '/login',

    }));


router.get('/logout', function(req, res) {
    req.logout();
    req.session.destroy();
    res.redirect('/');
});


router.get('/register', function(req, res, next) {
    res.render('register', { title: 'Registration' });
});

router.post('/register', function(req, res, next) {
    req.checkBody('username', 'Username field cannot be empty.').notEmpty();
    req.checkBody('username', 'Username must be between 4-15 characters long.').len(4, 15);

    req.checkBody('email', 'The email you entered is invalid, please try again.').isEmail();
    req.checkBody('email', 'The email must be between 4-100 characters long, please try again.').len(4, 100);

    req.checkBody('password', 'Password must be between 8-100 characters long.').len(8, 100);

    req.checkBody('password', 'Password must include one lowercase character, one uppercase character, a number, and a special character.').matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?!.* )(?=.*[^a-zA-Z0-9]).{8,}$/, 'i')

    req.checkBody('passwordMatch', 'Password must be between 8-100 characters long.').len(8, 100);
    req.checkBody('passwordMatch', 'Password do not match, please try again').equals(req.body.password);


    const errors = req.validationErrors();
    if (errors) {
        console.log(`errors: ${JSON.stringify(errors)}`);
        res.render('register', {
            title: 'Registration Error',
            errors: errors
        });
    } else {

        const username = req.body.username;
        const email = req.body.email;
        const password = req.body.password;

        const bd = require('../db.js');
        bcrypt.hash(password, saltRounds, function(err, hash) {

            bd.query('INSERT INTO users (username, email, password) VALUES (?,?,?)', [username, email, password],
                function(error, results, fields) {
                    if (error) throw error;

                    bd.query('SELECT LAST_INSERT_ID() as user_id', function(error, results, fields) {
                        if (error) throw error;
                        const user_id = results[0];

                        console.log(results[0]);
                        req.login(user_id, function(err) {
                            res.redirect('/');
                        });
                    });
                });
        });
    }


});


module.exports = router;