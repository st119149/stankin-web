const axios = require('axios');
const express = require('express');
const bodyParser = require('body-parser');
const SHA1 = require('sha1');
const cookieParser = require('cookie-parser')

const app = express();
app.set('views', './static')
app.set('view engine', 'ejs')
app.use(bodyParser.urlencoded({extended: false}))
app.use(express.static(__dirname + '/static'));
const host = '127.0.0.1';
const port = 7000;

const store = {
    isLogin: false,
    data: null
}

const authorize = (login, password) => axios({
    url: 'https://helloworldprojectt.herokuapp.com/v1/authorization',
    method: 'post',
    data: {
        login: login,
        password: SHA1(password)
    }
})

const fetchCars = (token) => axios({
    url: 'https://helloworldprojectt.herokuapp.com/v1/cars',
    method: 'get',
    headers: {
        'access_token': token
    },
    withCredentials: true
})

app.get('/login', (req, res) => {
    if (store.isLogin) {
        res.redirect('/');
        return;
    }
    res.render(`login`, {isWrong: false})
});

app.post('/login', async (req, res, next) => {
    const cookie = await authorize(req.body.login, req.body.password)
        .then(response => {
            store.isLogin = true;
            return response.headers['set-cookie'][0].split('=')[1].split(';')[0] //todo: cookie-parser
        })
        .catch(e => res.status(403).render('login', {isWrong: true}))
    if (!cookie)
        return;

    res.cookie('access-token', cookie);

    await fetchCars(cookie)
        .then(data => {
            store.data = data;
            res.status(200).redirect('/')
        })
        .catch(() => {
            res.status(404).redirect('/error')
        })
})

app.get('/', (req, res) => {
    if (!store.isLogin) {
        res.redirect('/login')
    } else {
        res.render(`index`, store.data)
    }
});

app.get('/error', (req, res) => {
    res.render(`error`)
});


app.listen(port, host, () => console.log(`Server listens http://${host}:${port}`));