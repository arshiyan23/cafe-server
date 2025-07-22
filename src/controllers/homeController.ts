import { Request, Response } from 'express';

export const home = (req: Request, res: Response): void => {
  res.json({ message: 'Welcome to the Express Boilerplate!' });
};
