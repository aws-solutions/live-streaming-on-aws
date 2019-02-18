import boto3

client=boto3.client('mediaconnect')

flow_arn='arn:aws:mediaconnect:us-east-1:282636047459:flow:1-Dg4LVwZXAlleB1pQ-63714fe823ba:testmc'

response=client.describe_flow(
FlowArn=flow_arn
)
print(reponse)
