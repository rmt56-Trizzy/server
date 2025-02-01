# <b>Trizzy</b> : API Documentation

## Users

### 1. Mutation: register

Description:

- Register a new user

Request

- operation:

```gql
mutation Mutation($input: RegisterInput) {
  register(input: $input)
}
```

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

- operation:

```gql
mutation Login($login: LoginInput) {
  login(login: $login) {
    access_token
    userId
  }
}
```

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

- operation:

```gql
query GetUserById($id: ID!) {
  getUserById(_id: $id) {
    _id
    fullName
    email
    password
  }
}
```

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

- operation:

```gql
mutation AddSubscription($payload: SubscriptionInput) {
  addSubscription(payload: $payload)
}
```

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

Request

- operation:

```gql
query GetSubscription {
  getSubscription {
    _id
    userId
    midtransId
    price
    startDate
    endDate
    transactionTime
  }
}
```

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

Request

- operation:

```gql
query Query {
  isSubscribed
}
```

Response (200):

```json
{
  "data": {
    "isSubscribed": boolean
  }
}
```

## Chat

### 1. Mutation: createChat

Description:

- Create new chat
- Authentication required

Request

- operation:

```gql
mutation Mutation($payload: ChatInput) {
  createChat(payload: $payload) {
    _id
    userId
    messages {
      sender
      message
    }
  }
}
```

- input:

```json
{
  "payload": {
    "userMessage": "string"
  }
}
```

Response (200):

```json
{
  "data": {
    "createChat": {
      "_id": "string",
      "userId": "string",
      "messages": [
        {
          "sender": "Bot",
          "message": "string"
        },
        {
          "sender": "User",
          "message": "string"
        }
      ]
    }
  }
}
```

### 2. Mutation: getReplyFromBot

Description:

- Get reply from bot
- Authentication required

Request

- operation:

```gql
mutation GetReplyFromBot($chatId: ID!) {
  getReplyFromBot(chatId: $chatId) {
    _id
    userId
    messages {
      sender
      message
    }
  }
}
```

- input:

```json
{
  "chatId": "string"
}
```

Response (200):

```json
{
  "data": {
    "getReplyFromBot": {
      "_id": "string",
      "userId": "string",
      "messages": [
        {
          "sender": "Bot",
          "message": "string"
        },
        {
          "sender": "user",
          "message": "string"
        },
        {
          "sender": "Bot",
          "message": "string"
        }
      ]
    }
  }
}
```

### 3. Mutation: saveReplyFromUser

Description:

- Save reply from user
- Authentication required

Request

- operation:

```gql
mutation SaveReplyFromUser($payload: SaveChatInput) {
  saveReplyFromUser(payload: $payload) {
    _id
    userId
    messages {
      sender
      message
    }
  }
}
```

- input:

```json
{
  "payload": {
    "chatId": "string",
    "userMessage": "string"
  }
}
```

Response (200):

```json
{
  "data": {
    "saveReplyFromUser": {
      "_id": "string",
      "userId": "string",
      "messages": [
        {
          "sender": "Bot",
          "message": "string"
        },
        {
          "sender": "user",
          "message": "string"
        },
        {
          "sender": "Bot",
          "message": "string"
        },
        {
          "sender": "User",
          "message": "string"
        }
      ]
    }
  }
}
```
