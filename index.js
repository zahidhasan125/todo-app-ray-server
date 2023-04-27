const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 5000;

require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.voxvdqi.mongodb.net/?retryWrites=true&w=majority`;

app.use(cors());
app.use(express.json());



// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {

        const todoCollections = client.db('RayToDo').collection('todoCollection');

        // CRUD for todo app

        // Create todo
        app.post('/create', async (req, res) => {
            const newToDo = req.body;
            const result = await todoCollections.insertOne(newToDo);
            res.send(result);
        })

        // Read todos
        app.get('/mytodos', async (req, res) => {
            const user = req.query.email;
            const query = { user }
            const mytodos = await todoCollections.find(query).toArray();
            res.send(mytodos);
        })

        // Update todo
        app.patch('/update', async (req, res) => {
            const todoId = req.query.todoId;
            const user = req.query.email;
            const newTaskName = req.body.newTaskName;
            const query = { _id: new ObjectId(todoId) };
            const updatingTodo = await todoCollections.findOne(query);
            const option = { upsert: true };
            const updateDoc = {
                $set: { taskName: newTaskName }
            }
            if (updatingTodo && updatingTodo.user === user) {
                const result = await todoCollections.updateOne(query, updateDoc, option);
                res.send(result);
            } else {
                res.status(403).send({ message: "You're not authorized to apply the changes." });
            }
        })

        // Delete todo
        app.delete('/delete', async (req, res) => {
            const todoId = req.query.todoId;
            const user = req.query.email;
            const query = { _id: new ObjectId(todoId) };
            const deletingTodo = await todoCollections.findOne(query);
            
            if (deletingTodo && deletingTodo.user === user) {
                const result = await todoCollections.deleteOne(query);
                res.send(result);
            } else {
                res.status(403).send({ message: "You're not authorized to apply the changes." });
            }
        })

    } finally {

    }
}
run()
    .catch(console.dir);


app.get('/', (req, res) => {
    res.send('Server Running');
});
app.listen(PORT, () => console.log(`Listening on: ${PORT}`));