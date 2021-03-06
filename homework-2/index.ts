import express, { NextFunction, Response, Request } from 'express';
import { v4 } from 'uuid';
import Joi from '@hapi/joi';

const app = express();
app.use(express.json());

/* Type declaration and validation schema for User */
type User = {
  id: string;
  login: string;
  password: string;
  age: number;
  isDeleted: boolean;
};
const users: Array<User> = [];

const userSchema = Joi.object({
  login: Joi.string().required(),
  password: Joi.string().required().alphanum(),
  age: Joi.number().required().min(4).max(130),
});
type UserSchema = typeof userSchema;

const userValidator = (schema: UserSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.body);

    if (error?.isJoi) {
      res.status(400).json(error.message);
    }
    next();
  };
};

/* CRUD operations for Users */
app.post('/users', userValidator(userSchema), (req, res) => {
  const user = req.body as User;

  user.id = v4();
  user.isDeleted = false;

  users.push(user);

  res.setHeader('Location', `/users/${user.id}`);
  res.status(201).send(user);
});

app.get('/users', (req, res) => {
  const { loginSubstring = '', limit = 10 } = req.query;

  const list = users
    .filter(user => user.login.includes(loginSubstring) && !user.isDeleted)
    .sort((a, b) => a.login.localeCompare(b.login))
    .slice(0, limit);

  res.send(list);
});

app.get('/users/:id', (req, res) => {
  const id = req.params.id;

  const userToFind = users.find(user => user.id === id);

  if (!userToFind) {
    res.status(404).send('User not found');
  }

  res.send(userToFind);
});

app.put('/users/:id', userValidator(userSchema), (req, res) => {
  const id = req.params.id;
  const { login, password, age } = req.body as User;

  const userToUpdate = users.find(u => u.id === id);

  if (!userToUpdate) {
    res.status(404).send('User is not found');
  } else {
    userToUpdate.login = login;
    userToUpdate.password = password;
    userToUpdate.age = age;

    res.send(userToUpdate);
  }
});

app.delete('/users/:id', (req, res) => {
  const id = req.params.id;
  const userToDelete = users.find(user => user.id === id);

  if (!userToDelete || userToDelete.isDeleted) {
    res.status(404).send('User is not found');
  } else {
    userToDelete.isDeleted = true;

    res.status(204).send();
  }
});

app.listen(3000, () => {
  console.log('Service is online');
});
