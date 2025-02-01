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

## Subscription

### 1. Mutation: addSubscription

Description:

- Add new subscription

Request

- input:

```json
{
  "payload": {
    "midtransId": "string",
    "price": 50
  }
}
```

Response (200):

```json
{
  "data": {
    "addSubscription": "Subscription added successfully"
  }
}
```

### 2. Query: getSubscription

Description:

- Get subscription for logged in user
- Authentication required

Response (200):

```json
{
  "data": {
    "getSubscription": {
      "_id": "string",
      "userId": "string",
      "midtransId": "string",
      "price": integer,
      "startDate": "string",
      "endDate": "string",
      "transactionTime": "string"
    }
  }
}
```

### 3. Query: isSubscribed

Description:

- Check if user is subscribed
- Authentication required

Response (200):

```json
{
  "data": {
    "isSubscribed": boolean
  }
}
```
