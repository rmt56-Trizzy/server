# <b>Trizzy</b> : API Documentation

## Users

### 1. Mutation: register

Description:

- Register a new user

Request

- input:

```json
{
  "input": {
    "fullName": "string",
    "email": "string",
    "password": "string"
  }
}
```

Response (200):

```json
{
  "data": {
    "register": "Register successful"
  }
}
```

### 2. Mutation: login

Description:

- Login existing user

Request

- input:

```json
{
  "login": {
    "email": "string",
    "password": "string"
  }
}
```

Response (200):

```json
{
  "data": {
    "login": {
      "access_token": "string",
      "userId": "string"
    }
  }
}
```

Response (400):

```json
{
  "errors": [
    {
      "message": "Invalid email or password"
    }
  ]
}
```

### 3. Query: getUserById

Description:

- Get user detail by id

Request

- input:

```json
{
  "id": "string"
}
```

Response (200):

```json
{
  "data": {
    "getUserById": {
      "_id": "string",
      "fullName": "string",
      "email": "string",
      "password": "string"
    }
  }
}
```
