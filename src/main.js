const App = require('./App');
const TestController = require('./controllers/TestController');

const controllers = [
    new TestController(),
];

const repository = null;

new App(repository, controllers,);
