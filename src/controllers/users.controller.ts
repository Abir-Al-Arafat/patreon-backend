import { Request, Response } from "express";

import { CreateUserQueryParams } from "../types/query-params";

import { IUser } from "../interfaces/user.interface";

export function getUsers(request: Request, response: Response) {
  response.send([]);
}

export function getUserById(request: Request, response: Response) {
  response.send({});
}

export function createUser(
  request: Request<{}, {}, IUser, CreateUserQueryParams>,
  response: Response<IUser>
) {
  return response.status(201).send({
    username: "anson",
    email: "anson@ansonthedev.com",
    name: "Anson",
  });
}
