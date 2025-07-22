import express, { Application } from 'express';
import cors from 'cors';
import routes from './routes';
import s3Routes from './routes/s3Routes';

const app: Application = express();
app.use(cors());
app.use(express.json());


//Routes
app.use('/', routes);

//S3
app.use('/s3', s3Routes);

export default app;
