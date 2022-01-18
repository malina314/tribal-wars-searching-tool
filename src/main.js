const App = require('./App');
const TestController = require('./controllers/TestController');
const MainpageController = require('./controllers/MainpageController');
const QueryController = require('./controllers/QueryController');
const ResultController = require('./controllers/ResultController');

const controllers = [
    // new TestController(),
    new MainpageController(),
    new QueryController(),
    new ResultController(),
];

const repository = null;

new App(repository, controllers);
