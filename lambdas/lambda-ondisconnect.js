import { DynamoDBClient, DeleteItemCommand } from "@aws-sdk/client-dynamodb";

const ddb = new DynamoDBClient({ region: process.env.AWS_REGION });
const TABLE = process.env.CONNECTIONS_TABLE;

export const handler = async (event) => {

  const { connectionId } = event.requestContext;
  try {
    await ddb.send(new DeleteItemCommand({
      TableName: TABLE,
      Key: {
        connectionId: { S: connectionId }
      }
    }));  
    return { statusCode: 200, body: 'Disconnected.' };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: 'Failed to disconnect: ' + JSON.stringify(err) };
  } 
};
