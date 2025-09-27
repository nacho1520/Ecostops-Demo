import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";

const sqs = new SQSClient({ region: process.env.AWS_REGION });
const QUEUE_URL = process.env.SQS_QUEUE_URL; 

export const handler = async (event) => {
  const body = event.body ? JSON.parse(event.body) : event;

  const required = ["busId", "line", "lat", "long", "passengers", "waitTimeMin"];
  const missing = required.filter((key) => body[key] === undefined || body[key] === null);

  if(missing.length > 0) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: `Missing required fields: ${missing.join(", ")}`,
      }),
    };
  }

  const msg = {
    ...body
  };

  try {
    await sqs.send(new SendMessageCommand({
      QueueUrl: QUEUE_URL,
      MessageBody: JSON.stringify(msg),
    }));

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "Message sent to SQS",
        busId: body.busId
      }),
    }

  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error sending message to SQS",
      }),
    };
  } 
};
