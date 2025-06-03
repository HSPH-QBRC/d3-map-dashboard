# D3-Map-Dashboard
A public-facing, flexible geographic data dashboard designed to showcase scientific results from the Harvard community. The platform supports a range of research inquiries through an interactive and discoverable interface. It features a performant, serverless backend infrastructure optimized for efficiently serving spatial data.

## How to update from the command line
```
1. npm run build
2. cd dist/d3-map-dashboard
3. aws s3 rm s3://map-dashboard-app-jq --recursive
4. aws s3 sync . s3://map-dashboard-app-jq
```

## Lambda function code
The dashboard follows a serverless architecture, using an AWS Lambda function to query specific data from an S3 bucket via S3 Select—eliminating the need to load entire files. Serverless was chosen for its scalability, low operational overhead, and cost efficiency. The Lambda function’s code is located in the src/lambda directory.

## Link to website
[Map Dashboard](http://map-dashboard-app-jq.s3-website-us-east-1.amazonaws.com/)


## Screenshot
![Dashboard Screenshot](https://map-dashboard-app-jq.s3.us-east-1.amazonaws.com/assets/screenshot/ss.png)


