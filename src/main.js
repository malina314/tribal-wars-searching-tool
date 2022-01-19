const App = require('./App');
const MainpageController = require('./controllers/MainpageController');
const QueryController = require('./controllers/QueryController');
const ResultController = require('./controllers/ResultController');
const DbMock = require('./repository/DbMock');

const controllers = [
    new MainpageController(),
    new QueryController(),
    new ResultController(),
];

const repository = new DbMock;

new App(repository, controllers);
