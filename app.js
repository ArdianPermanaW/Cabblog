const express = require('express');
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const { json } = require('body-parser');
require('dotenv').config();

const app = express()
const port = 3000;

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Set up EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Session setup
app.use(session({
    secret: process.env.SECRET_KEY, 
    resave: false,
    saveUninitialized: true
}));

// Sample admin credentials (hardcoded for simplicity)
const adminCredentials = {
    username: 'admin',
    password: 'password123' // use hash n stuff in a real app
};
  
// #region routes 

//read dir to grab article data to be displayed at home
app.get('/', (req, res) => {
    fs.readdir('./articles', (err, files) => {
        if (err) {
            res.status(500).send('Error reading articles.');
            return;
        }
        // Extract article titles from filenames
        const articleLinks = files.map(file => {
            const articleTitle = path.basename(file, '.json'); // Use filename as title
            return { title: articleTitle, file: file };
        });

        // Render home page with list of articles
        res.render('home', { articles: articleLinks });
    });
});

//load the specified article data to be displayed at article.ejs
app.get('/article/:title', (req, res) => {
    const articleTitle = req.params.title;
    fs.readFile(`./articles/${articleTitle}`, 'utf8', (err, data) => {
        if (err) {
            res.status(404).send('Article not found.');
            return;
        }

        const article = JSON.parse(data);
        res.render('article', { article: article });
    });
});

// Admin login 
app.get('/admin/login', (req, res) => {
    res.render('admin/login'); 
});

// Handle login form submission
app.post('/admin/login', (req, res) => {
    const { username, password } = req.body;
  
    if (username === adminCredentials.username && password === adminCredentials.password) {
    // Store admin session
        req.session.isAdmin = true;
        res.redirect('/admin/dashboard'); 
    } else {
        res.send('WRONG *very loud incorrect buzzer noise*. Please try again by going back a page.');
    }
});

// Protect all /admin routes
function isAdmin(req, res, next) {
    if (req.session && req.session.isAdmin) {
        return next(); // User is authenticated, proceed as normal
    } else {
        res.redirect('/admin/login'); // Redirect to login if not authenticated
    }
}
app.use('/admin', isAdmin);


app.get('/admin/dashboard', (req, res) => {
    fs.readdir('./articles', (err, files) => {
        if (err) {
            res.status(500).send('Error reading articles.');
            return;
        }
        // Extract article titles from filenames
        const articleLinks = files.map(file => {
            const articleTitle = path.basename(file, '.json'); // Use filename as title
            return { title: articleTitle, file: file };
        });

        // Render home page with list of articles
        res.render('admin/dashboard', { articles: articleLinks });
    });
});

app.get('/admin/writeArticle', (req, res) => {
    res.render('admin/writeArticle');
})

//handle form submission for edit and writeArticle
app.post('/admin/articles', (req, res) => {
    const {title, content, date } = req.body;

    if (!title || !content || !date) {
        return res.status(400).send('All fields are required');
    }

    const article = {
        title: title,
        content: content,
        date: date,
    };

    // Save the article to a file 
    const articlesDir = path.join(__dirname, 'articles', `${title}.json`); 
    fs.writeFileSync(articlesDir, JSON.stringify(article, null, 2));
    res.redirect('/admin/dashboard');
})

//edit specified article
app.get('/admin/edit/:title', (req, res) => {
    const articleTitle = req.params.title;
    fs.readFile(`./articles/${articleTitle}`, 'utf8', (err, data) => {
        if (err) {
            res.status(404).send('Article not found.');
            return;
        }

        const article = JSON.parse(data);
        res.render('admin/edit', { article: article });
    });
});

//delete specified article
app.get('/admin/delete/:id', (req,res) => {
    const id = req.params.id;
    const filePath = path.join(__dirname, 'articles', `${id}`);

    //this deletes the file
    fs.unlink(filePath, (err) => {
        if(err){
            console.error(`Error deleting file: ${err}`);
            return res.status(500).send('Error deleting the article.');
        }

        console.log(`File deleted: ${filePath}`);
        res.redirect('/admin/dashboard');
    })
});

//#endregion

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

