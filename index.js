const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config();
const PORT = process.env.PORT || 5000;
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');


app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.voxvdqi.mongodb.net/?retryWrites=true&w=majority`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

const verifyJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).send({ message: 'Unauthorized!' });
    }

    const jwtToken = authHeader.split(' ')[1];

    jwt.verify(jwtToken, process.env.TOKEN_SECRET, (tokenError, decoded) => {
        if (tokenError) {
            return res.status(403).send({ message: "You're not authorized to apply the changes." });
        }
        req.decoded = decoded;
        next();
    });
};


async function run() {
    try {
        // todo collection
        const todoCollections = client.db('RayToDo').collection('todoCollection');
        const userCollections = client.db('RayToDo').collection('userCollection');

        // jwt auth token endpoint

        app.get('/jwt', async (req, res) => {
            const user = req.query.email;
            const query = { user };
            const userExist = await userCollections.findOne(query);

            if (!userExist) {
                return res.status(401).send({ message: 'Unauthorized!' });
            }

            const token = jwt.sign({ user }, process.env.TOKEN_SECRET, { expiresIn: '7 days' });
            res.send({ todoAccessToken: token });
        })

        // User sign up

        app.post('/register', async (req, res) => {
            const userInfo = req.body;
            const query = { email: userInfo.email };
            const userExist = await userCollections.findOne(query);

            if (userExist) {
                return res.send({ message: 'User already exists.' })
            }
            const result = await userCollections.insertOne(userInfo);
            res.send(result);
        })

        // User login

        app.post('/login', async (req, res) => {
            const userData = req.body;
            const email = userData.email;
            const query = { email };
            const userExist = await userCollections.findOne(query);

            if (userExist && userExist.pass == userData.pass) {
                const token = jwt.sign({ email }, process.env.TOKEN_SECRET, { expiresIn: '7 days' });
                res.send({ todoAccessToken: token });
            } else {
                res.send({ todoAccessToken: '' });
            }
        })

        // ToDo Group endpoints

        app.get('/group/:id', async (req, res) => {
            const groupId = parseInt(req.params.id);
            const query = { groupId };
            const toDosByGroup = await todoCollections.find(query).toArray();
            res.send(toDosByGroup);
        })

        // CRUD for todo app

        // Create todo
        app.post('/create', verifyJWT, async (req, res) => {
            const newToDo = req.body;
            const result = await todoCollections.insertOne(newToDo);
            res.send(result);
        })

        // Read todos
        app.get('/mytodos', verifyJWT, async (req, res) => {
            const user = req.query.email;
            const query = { user }
            const mytodos = await todoCollections.find(query).toArray();
            res.send(mytodos);
        })

        // Update todo
        app.patch('/update', verifyJWT, async (req, res) => {
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
        app.delete('/delete', verifyJWT, async (req, res) => {
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