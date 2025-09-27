import { DynamoDBClient, ScanCommand, DeleteItemCommand  } from "@aws-sdk/client-dynamodb";
import { ApiGatewayManagementApi } from "@aws-sdk/client-apigatewaymanagementapi";

const ddb = new DynamoDBClient({ region: process.env.AWS_REGION });
const TABLE = process.env.CONNECTIONS_TABLE;

const api = new ApiGatewayManagementApi({
  endpoint: process.env.WS_ENDPOINT
});

export const handler = async (event) => {
  console.log("DynamoDB Stream Event:", JSON.stringify(event, null, 2));

  for (const record of event.Records) {
    if (record.eventName === "INSERT" || record.eventName === "MODIFY") {
      const newImage = record.dynamodb.NewImage;

      // Extraer datos del bus
      const msg = {
        busId: newImage.busId.S,
        line: newImage.line.S,
        passengers: Number(newImage.passengers.N),
        waitTimeMin: Number(newImage.waitTimeMin.N),
        position: {
          lat: Number(newImage.lat.N),
          long: Number(newImage.long.N)  
        }
      };

      console.log("Nuevo update de bus:", msg);

      // Buscar conexiones activas
      const conns = await ddb.send(new ScanCommand({ TableName: TABLE }));

      for (const c of conns.Items) {
        try {
          // Filtrar por línea si corresponde
          if (c.line.S !== msg.line && c.line.S !== "-") {
            continue;
          }

          await api.postToConnection({
            ConnectionId: c.connectionId.S,
            Data: Buffer.from(JSON.stringify(msg))
          });

          console.log(`Enviado a connectionId ${c.connectionId.S}`);
        } catch (err) {
          if(err.statusCode === 410) {
            console.log(`Conexión expirada: ${ c.connectionId.S }, eliminando...`);
            await ddb.send(new DeleteItemCommand({
              TableName: TABLE,
              Key: {
                connectionId: { S: c.connectionId.S }
              }
            }));
          } else {
            console.error("Error enviando a conexión:", c.connectionId.S, err);
          }
        }
      }
    }
  }

  return { statusCode: 200 };
};
