import boto3
import json
import io

def lambda_handler(event, context):
    # Initialize S3 client
    s3 = boto3.client('s3')

    cors_headers = {
        'Access-Control-Allow-Origin': '*',  # Allow all origins; replace with specific origin for production
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }

    # Parse input parameters from the event
    try:
        dataset = event['queryStringParameters']['dataset']
        if not dataset:
            raise ValueError("Missing required parameter: dataset")
    except (TypeError, KeyError, ValueError):
        return {
            'statusCode': 400,
            'headers': cors_headers,
            'body': json.dumps({'error': 'Missing or invalid query parameters: dataset'})
        }
    
    # S3 bucket and file details
    bucket_name = "map-dashboard-bucket-jq"

    dataset_files = {
        'grocery': 'grocery_data_dictionary.csv',
        'carmen': 'carmen_data_dictionary.csv'
    }

    file_key = dataset_files.get(dataset)

    if not file_key:
        return {
            'statusCode': 400,
            'headers': cors_headers,
            'body': json.dumps({'error': f"Invalid dataset: {dataset}"})
        }

    query = "SELECT * FROM s3object s"
        
    try:
        # Execute S3 Select query with byte range for pagination
        response = s3.select_object_content(
            Bucket=bucket_name,
            Key=file_key,
            Expression=query,
            ExpressionType='SQL',
            InputSerialization={
                'CSV': {
                    'FileHeaderInfo': 'USE'
                },
                'CompressionType': 'NONE'
            },
            OutputSerialization={'JSON': {}}
        )
        
        # Collect results
        results = []
        buffer = io.StringIO()  # Accumulate data properly
        for event in response['Payload']:
            if 'Records' in event:
                buffer.write(event['Records']['Payload'].decode('utf-8'))  # Store complete JSON payload

        try:
            # Load all accumulated JSON lines correctly
            buffer.seek(0)  # Move to the beginning of the buffer
            for line in buffer:
                line = line.strip()
                if not line:
                    continue  # Skip empty lines
                try:
                    row = json.loads(line)
                    # print(f"Line: {line}")

                    # Extract necessary values
                    column_name = row.get("column_name")
                    description = row.get("description")
                    data_type = row.get("data_type")

                    # Ensure column_name exists before processing
                    if column_name:
                        formatted_row = {
                                "column_name": column_name,
                                "description": description,
                                "data_type": data_type
                        }
                        results.append(formatted_row)
                except json.JSONDecodeError as e:
                    print(f"Error decoding line: {line} -> {str(e)}")
        except Exception as e:
            print(f"Unexpected error while processing JSON: {str(e)}")

        # If results exist, return them
        if results:
            return {
                'statusCode': 200,
                'headers': cors_headers,
                'body': json.dumps(results)
            }
    
    except Exception as e:
        # Log and return any other unexpected error
        print(f"Error: {str(e)}")

        if "InvalidScanRange" in str(e):
            return {
                'statusCode': 200,
                'headers': cors_headers,
                'body': json.dumps({'message': f'No more rows available.'})
            }

        return {
            'statusCode': 500,
            'headers': cors_headers,
            'body': json.dumps({'error': str(e)})
        }
