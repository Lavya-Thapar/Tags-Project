// app.js
const express = require('express');
const mongoose = require('mongoose');
const natural = require('natural');
const tokenizer = new natural.WordTokenizer();
const stopword = require('stopword');

const bodyParser = require('body-parser');

const app = express();
const port = 3000;

// Set up EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

// Connect to MongoDB
mongoose.connect("mongodb+srv://Lavya_Thapar:lavya_1107@cluster0.wr4ry27.mongodb.net/blogs?retryWrites=true&w=majority", { useNewUrlParser: true, useUnifiedTopology: true });

// Create a MongoDB model for the articles
const Article = mongoose.model('Article', {
    heading: String,
    content: String,
    tags: [String]
    
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// ... (your existing routes)

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// Your existing /submit route
app.post('/submit', async (req, res) => {
    try {
    //     // Save the submitted blog to MongoDB
    //     const newBlog = new Article({
    //         heading: req.body.heading,
    //         content: req.body.content,
    //     });
        // await newBlog.save();
        const { heading, content } = req.body;

        // Extract keywords from heading and content
        const keywords = extractKeywords(req.body.heading, req.body.content);

        // Suggest tags based on keywords
        const suggestedTags = suggestTags(keywords);

        // Render a page with a popup/modal containing suggested tags
        res.render('tagSelection', {heading,content,suggestedTags});
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});
// Function to extract keywords from heading and content
function extractKeywords(heading, content) {
    const tokens = tokenizer.tokenize(content.toLowerCase());
    const filteredTokens = stopword.removeStopwords(tokens);
    filteredTokens.push(heading);
    const uniquetokens = [...new Set(filteredTokens)];
    // Combine and deduplicate keywords
    // const allKeywords = [...new Set([...headingKeywords, ...contentKeywords])];

    return uniquetokens;
}

// Function to suggest tags based on keywords
function suggestTags(keywords) {
    // Your custom logic for suggesting tags based on keywords
    // Example: Just use the first few keywords as tags
    const size=keywords.length;
    let suggestedTags=[];
    if(size<=10){
        suggestedTags = keywords.slice(0, size).map(keyword => `#${keyword}`);
    }
    else{
        const part_one=keywords.slice(0, size/3).map(keyword => `#${keyword}`);
        const part_two=keywords.slice(2*size/3, size).map(keyword => `#${keyword}`);
        for(let i=0;i<part_one.length;i++)
        {
            suggestedTags.push(part_one[i]);
        }
        for(let i=0;i<part_two.length;i++)
        {
            suggestedTags.push(part_two[i]);
        }
    }
    return suggestedTags;
}
app.post('/createwithtags', async (req, res) => {
    try {
        const { heading, content, tags_input } = req.body;
        
        // Save the submitted blog to MongoDB
        const newBlog = new Article({
            heading: heading,
            content: content,
            // tags: tags_input.split(' ').map(tag => `#${tag}`),
            tags: tags_input,
        });

        await newBlog.save();

        // Redirect back to the create blog page
        res.redirect('/');
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/myblogs', async (req, res) => {
    try {
        const articles = await Article.find();
        res.render('myblogs', { articles });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});
app.get('/getcontent/:id', async (req, res) => {
    try {
        const articleId = req.params.id;
        const article = await Article.findById(articleId);
        res.send(article ? article.content : '');
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});
app.post('/addtags/:blogId', async (req, res) => {
    try {
        const blogId = req.params.blogId;
        const selectedTags = req.body.tags || [];

        // Retrieve the blog from MongoDB
        const blog = await Article.findById(blogId);

        // Add selected tags to the blog
        if (blog) {
            blog.tags = selectedTags;
            await blog.save();
        }

        // Redirect to the blog page
        res.redirect(`/`);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});
app.delete('/delete/:id', async (req, res) => {
    const blogId = req.params.id;

    try {
        // Find the blog entry by ID and delete it
        await Article.findByIdAndDelete(blogId);

        res.status(200).json({ message: 'Blog deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
