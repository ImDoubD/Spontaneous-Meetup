## Setup Instruction and Running The Application Steps
- The file-folder structure followed is Model-View-Controller API Architecture with Service layer having the business logic, in return representing modular, clean code format.
- This project uses Node.js (22.10.2 ver) with Express (5.0.0 ver).
```bash
npm i
npm run build
npm start
```
- All the required packages will be installed using this command `npm i`.
- Always build first using `npm run build` and start the server using `npm start`, whenever changes done in code. For testing use `npm run test`.
- Redis instance is deployed on Redis.io free instance (size alloted: 30 MB).
- For Kafka, local instance has to be started. Install Apache Kafka first. CMD Commands are as follows.
```bash
.\bin\windows\zookeeper-server-start.bat .\config\zookeeper.properties
.\bin\windows\kafka-server-start.bat .\config\server.properties
kafka-topics.bat --create --bootstrap-server localhost:9092 --replication-factor 1 --partition 1 --topic test
kafka-console-producer.bat --broker-list localhost:9092 --topic test (starts Producer instance)
kafka-console-consumer.bat --topic test --bootstrap-server localhost:9092 --from-beginning (starts consumer instance)
```
- I have set-up an automated testing pipeline, which on push command runs the unit tests and build command as well. I am using Github Action for the pipeline in which conatiner of node version 20 is used and it runs on ubuntu-latest OS.

## API Endpoints List
- Clone the github repository
- Install all the given requirements as provided in the installation part.
- The databse used in MongoDB Atlas.
- - Hit the APIs given in Postman collection. \
  (Postman Link: https://imf-gadget-6862.postman.co/workspace/IMF-Gadget-Workspace~2c1d2ceb-6724-4b55-abd5-23126b322058/collection/34221288-bc58b3d0-87b4-4d91-9ba7-9c693a16073c?action=share&creator=34221288 )
- After registeration and login, provide the JWT token to bearer authentication in Postman. Only after that, other APIs will be accessible.
- To start the server, use command: `npm run build` `npm start` \
  Hit the API's (in Postman or Thunderclient) in this order:
- 𝗣𝗢𝗦𝗧 `http://localhost:3000/users/register`\
  Sample input:
  ```bash
    {
      "email": "dd@example.com",
      "password": "1234dd"
    }
  ```
  Description:
    - Validation: Checks that an email and password are provided.
    - Duplication Check: The AuthService checks if a user with the same email already exists.
    - Password Hashing: Uses a pre-save hook in the user model (via bcrypt) to securely hash the password before saving.
    - Response: On success, returns a success message with status 201. On failure (e.g., duplicate email), returns a 400 error.
- 𝗣𝗢𝗦𝗧 `http://localhost:3000/users/login`\
  Sample input:
  ```bash
    {
      "email": "dd@example.com",
      "password": "1234dd"
    }
  ```
  Description:
    - User Lookup: Finds the user by email.
    - Password Verification: Compares the provided password against the stored hashed password using the model’s comparePassword method.
    - JWT Generation: On successful verification, generates a JWT token using the generateToken helper.
    - Response: Returns the user object and JWT token with a 200 status. On invalid credentials, returns a 400 error.
- POST `http://localhost:3000/broadcasts` \
  `Authorization: Bearer <token>` \
  Sample input: 
  ```bash
    {
      "title": "Morning Jog Meetup",
      "description": "Join us for a refreshing jog in Central Park.",
      "activityType": "jogging",
      "startTime": "2025-02-13T07:00:00.000Z",
      "endTime": "2025-02-13T08:00:00.000Z",
      "location": {
        "type": "Point",
        "coordinates": [-73.9654, 40.7829]
    }
  ```
  Description:
    - Input Validation: Uses a Zod schema (validateCreateBroadcast) to ensure the incoming data meets criteria:
      - title must be a non-empty string.
      - activityType and other fields must have proper formats.
      - startTime and endTime are valid dates.
      - location is a valid GeoJSON Point.
    - Authenticated User: The auth middleware attaches the user object to the request. The controller then uses req.user.id as the hostUserId.
    - Broadcast Creation: The BroadcastService creates a new broadcast document with a forced status of 'active'.
    - Redis Caching: Immediately after creation, the broadcast is cached in Redis with a TTL determined by the difference between endTime and the current time.
    - Notification: A Kafka-based notification is sent to indicate that a new broadcast has been created.
    - Response: On success, returns the created broadcast with a 201 status.
- POST `http://localhost:3000/broadcasts?lng=-73.935242&lat=40.73061&radius=5000` \
  `Authorization: Bearer <token>` \
  Sample input: 
  ```bash
    Params Variable: lng, lat, radius
  ```
  Description:
    - Query Parameters: Requires lng (longitude) and lat (latitude); radius is optional (default is 5000 meters).
    - Geospatial Query: Uses MongoDB’s $nearSphere operator on the location field to find broadcasts near the given coordinates.
    - Response: Returns a list of active broadcasts (those with status 'active' and endTime in the future).
- POST `http://localhost:3000/broadcasts/join/:id` \
  `Authorization: Bearer <token>` \
  Sample input: 
  ```bash
    Params Variable: id
  ```
  Description:
    - Authenticated User: Uses the authenticated user’s ID from req.user.id.
    - Update Operation: Uses MongoDB’s $addToSet operator to add the user ID to the participants array if not already present.
    - Notification: If successful, sends a Kafka notification indicating that a user has joined the broadcast.
    - Response: Returns the updated broadcast. If no broadcast is found, returns a 404 error.
- POST `http://localhost:3000/broadcasts/leave/:id` \
  `Authorization: Bearer <token>` \
  Sample input: 
  ```bash
    Params Variable: id
  ```
  Description:
    - Authenticated User: Uses the authenticated user’s ID from req.user.id.
    - Update Operation: Uses MongoDB’s $pull operator to remove the user ID from the participants array if present.
    - Notification: If successful, sends a Kafka notification indicating that a user has left the broadcast.
    - Response: Returns the updated broadcast. If no broadcast is found, returns a 404 error.

## Event-Based Notification & Auto-Expiry
- Notification Service (using Kafka)
  - Event Types:
    - `BROADCAST_CREATED` – Triggered when a new broadcast is created.
    - `USER_JOINED` – Triggered when a user joins an existing broadcast.
    - `BROADCAST_EXPIRED` – (Potentially triggered via scheduled job) when a broadcast’s end time is reached.
  - How It Works:
    - `Producer`: The NotificationService sends events to a Kafka topic (notifications). These events contain the type, user ID, broadcast ID, timestamp, and any additional metadata.
    - `Consumer`: A Kafka consumer (set up in the NotificationService singleton) subscribes to the notifications topic. It processes each message (for now the notification/message logs are shown on the terminal). This decouples the main application logic from the actual notification handling.
- Auto-Expiry Logic
  - Method: `expireBroadcasts()`
  - Business Logic:
    - Periodically (likely via a cron job or background worker), the BroadcastService method expireBroadcasts is called.
    - Query: Updates all broadcasts that have an endTime earlier than or equal to the current time and are still marked as 'active'.
    - Result: Sets their status to 'expired', preventing further interactions like joining.

## Edge Cases and Validations (As Covered in Unit Tests) [Please ignore the kafka connection error during push as kafka shouold be enabled locally]
- Controller Tests:
  - Validation Failures:
    - If required broadcast fields (such as title, activityType, startTime, endTime, or location) are missing or invalid, the validation logic (using Zod) in the controller returns a 400 error.
  - Service Errors:
    - If the underlying service (e.g., broadcast creation or joining or leave) throws an error (due to database issues or logic errors), the controller catches it and returns a 500 error.
  - Not Found Cases:
    - For endpoints like joining or leaving a broadcast, if no matching broadcast is found (e.g., invalid ID or broadcast is not active), the controller returns a 404 error.
- Service Tests:
  - Successful Operations:
    - Create Broadcast:
      - Tests confirm that when all required data is provided, a broadcast is created, cached in Redis, and a notification is sent.
    - Get Active Broadcasts:
      - Tests verify that the geospatial query returns the expected broadcasts.
    - Join Broadcast:
      - Tests confirm that a user is added only once (using $addToSet), and that a notification is sent upon successful join.
    - Leave Broadcast:
      - Tests confirm that a user leaves (using $pull), and that a notification is sent upon successful leave.
  - Error Handling:
    - Tests simulate failures (e.g., throwing errors from Mongoose operations or Redis/Kafka failures) to ensure that errors are propagated correctly.
  - Bulk Update (Expiry):
    - Tests verify that broadcasts with past endTime are updated to 'expired'.
- Model Tests:
  - Required Fields:
    - Tests validate that when key fields (e.g., title, hostUserId, activityType, startTime, endTime, and location) are missing, Mongoose raises validation errors.
  - Location Validation:
    - Tests ensure that the nested location object must have type equal to "Point" and valid coordinates (using a tuple type).
  - Successful Validation:
    - Tests confirm that a properly formatted broadcast document does not yield validation errors.

## Optimizations
- MongoDB Indexing:
  - Geospatial Index:
    - The location field is indexed with the 2dsphere index. This allows efficient geospatial queries (e.g., finding broadcasts near a location) and is essential for the $nearSphere operator used in getActiveBroadcasts.
  - Compound Index on Status & End Time:
    - The compound index on status and endTime helps optimize queries that filter active broadcasts and check for expiry. This improves performance when fetching broadcasts that have not expired.
- Redis Caching:
  - Broadcast Caching:
    - When a broadcast is created, it is immediately cached in Redis with a TTL calculated from its endTime. This allows for faster retrieval of broadcast details without hitting the database repeatedly.
  - Rate Limiting:
    - Redis is also used as a backing store for rate limiting (using packages such as express-rate-limit with a Redis store). This helps prevent abuse (e.g., spamming broadcast creation) by limiting the number of requests per IP address within a time window.
- Kafka-based Event Notifications:
  - Asynchronous Processing:
    - Kafka is used to decouple notification logic from the main application flow. Events (like broadcast creation or user joining) are produced and then consumed by a separate process that handles notifications.
  - Scalability and Fault Tolerance:
    - Kafka provides a robust, scalable messaging system that can handle high throughput and ensure that notifications are reliably delivered even under load.
- Auto-Expiry of Outdated Broadcasts:
- Background Worker/Cron Job: A background process (e.g., a worker or scheduled job) calls expireBroadcasts periodically. This ensures that outdated broadcasts are automatically marked as expired, keeping the data current and queries simpler.
