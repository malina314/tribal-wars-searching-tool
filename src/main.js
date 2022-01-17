const App = require('./App');
const TestController = require('./controllers/TestController');
const MainpageController = require('./controllers/MainpageController');

const controllers = [
    new TestController(),
    new MainpageController(),
];

const repository = null;

new App(repository, controllers);
