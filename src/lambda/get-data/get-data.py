import boto3
import json
import time  # Import time module for benchmarking
import io

def lambda_handler(event, context):
    start_time = time.time()  # Start overall timing

    # Initialize S3 client
    s3 = boto3.client('s3')
    init_time = time.time()
    print(f"S3 client initialized in {init_time - start_time:.2f} seconds")
    cors_headers = {
        'Access-Control-Allow-Origin': '*',  # Allow all origins; replace with specific origin for production
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }

    # Parse input parameters from the event
    try:
        parse_start = time.time()
        year = event['queryStringParameters']['year']
        column1 = event['queryStringParameters']['column1']
        # column2 = event['queryStringParameters']['column2']
        column2 = event['queryStringParameters'].get('column2', None)
        column3 = event['queryStringParameters'].get('column3', None)
        offset = int(event['queryStringParameters'].get('offset', 0))
        parse_end = time.time()
        print(f"Parsed input parameters in {parse_end - parse_start:.2f} seconds")
    except (TypeError, KeyError, ValueError):
        return {
            'statusCode': 400,
            'headers': cors_headers,
            'body': json.dumps({'error': 'Missing or invalid query parameters: year, column1, column2'})
        }
    
    # S3 bucket and file details
    bucket_name = "map-dashboard-bucket-jq"
    query_start = time.time()
    if column1 == 'nsdoh_profiles' or column1 == 'nsdoh_profiles_scrambled':
        file_key = 'nsdoh_data.csv'
        # file_key = 'nsdoh_data_scrambled.csv'
        # query = f"""
        #     SELECT s."GEOID", s."countycode", s."NAME", s."nsdoh_profiles", s."nsdoh_profiles_scrambled"
        #     FROM s3object s
        # """
        query = f"""
            SELECT s."GEOID", s."countycode", s."NAME", s."nsdoh_profiles"
            FROM s3object s
        """
    else:
        id = 'tract_fips10'
        file_key = "nanda_grocery_tract_2003-2017_01P.csv"
        additional_columns = []
        if column1 != 'population' and column2 != 'population' and column3 != 'population':
            additional_columns.append('population')
        select_columns = f's."{id}", s."{column1}"'
        if column2:
            select_columns += f', s."{column2}"'
        if column3:
            select_columns += f', s."{column3}"'
        if additional_columns:
            select_columns += ", " + ", ".join(f's."{col}"' for col in additional_columns)
        query = f"""
            SELECT {select_columns} 
            FROM s3object s 
            WHERE s."year" = '{year}'
        """
    query_end = time.time()
    print(f"Query constructed in {query_end - query_start:.2f} seconds")
    
    try:
        # Use byte range to paginate the file
        # range_size = 10240 * 10240  # Adjust range size as needed (e.g., 100MB chunks)
        range_size = 50000000 # Range size is about 50mb chunk
        start_byte = offset * range_size
        end_byte = start_byte + range_size - 1
        
        s3_start = time.time()
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
            OutputSerialization={'JSON': {}},
            ScanRange={
                'Start': start_byte,
                'End': end_byte
            }
        )
        s3_end = time.time()
        print(f"S3 query executed in {s3_end - s3_start:.2f} seconds")
        
        process_start = time.time()
        # Collect results
        results = []
        # for event in response['Payload']:
        #     if 'Records' in event:
        #         raw_payload = event['Records']['Payload'].decode('utf-8')
        #         for line in raw_payload.splitlines():
        #             try:
        #                 row = json.loads(line)
        #                 if 'nsdoh_profiles' in row:
        #                     row['nsdoh_profiles'] = row['nsdoh_profiles'].replace("\r", "")
        #                 results.append(row)
        #             except json.JSONDecodeError:
        #                 print(f"Error decoding line: {line}")
        #                 continue  # Skip malformed lines
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
                    if 'nsdoh_profiles' in row:
                        row['nsdoh_profiles'] = row['nsdoh_profiles'].replace("\r", "")
                    results.append(row)
                except json.JSONDecodeError as e:
                    print(f"Error decoding line: {line} -> {str(e)}")
        except Exception as e:
            print(f"Unexpected error while processing JSON: {str(e)}")
        process_end = time.time()
        print(f"Processed results in {process_end - process_start:.2f} seconds")

        # If results exist, return them
        if results:
            total_time = time.time() - start_time
            print(f"Total execution time: {total_time:.2f} seconds")
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
