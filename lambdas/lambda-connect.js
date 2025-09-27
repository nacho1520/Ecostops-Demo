import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";

const ddb = new DynamoDBClient({ region: process.env.AWS_REGION });
const TABLE = process.env.CONNECTIONS_TABLE;
const TTL_SECONDS = parseInt(process.env.TTL_SECONDS || "86400", 10);


export const handler = async (event) => {
  const { connectionId, domainName, stage } = event.requestContext;  
  const qs = event.queryStringParameters || {};
  const line = qs.line || "-";
  
  const expireAt = Math.floor((Date.now() / 1000) + TTL_SECONDS);
  
  try {
    await ddb.send(new PutItemCommand({
      TableName: TABLE,
      Item: {
        connectionId: { S: connectionId },
        domainName: { S: domainName },
        stage: { S: stage },
        line: { S: line },
        connectedAd: { S: new Date().toISOString() },
        expireAt: { N: expireAt.toString() }
      }
    }));

    return { statusCode: 200, body: 'Connected.' }; 
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: 'Failed to connect: ' + JSON.stringify(err) };
  } 
};
