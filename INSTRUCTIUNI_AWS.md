# Creating an AWS access key

## Step 1: Remove the existing key when its secret was not saved

1. Select the existing access key in IAM.
2. Choose `Actions` then `Delete`.
3. Confirm the deletion.

---

## Step 2: Create a new key

1. Select **Create access key**.
2. Choose the **Command Line Interface (CLI)** use case.
3. Confirm the AWS recommendation notice.
4. Select **Next**.
5. Optionally add a description such as `BitSwap CLI Deploy`.
6. Select **Create access key**.

---

## Step 3: Store credentials safely

AWS shows the secret access key only once. Store credentials in a secure secret manager and never commit them to source control, documentation, logs, or browser-delivered files.

```text
AWS_ACCESS_KEY_ID=<REDACTED>
AWS_SECRET_ACCESS_KEY=<REDACTED>
```

If a real credential was ever committed or exposed, revoke it and create a replacement before deployment.

---

## Step 4: Configure the AWS CLI

```bash
aws configure

AWS Access Key ID [None]: PASTE_ACCESS_KEY_HERE
AWS Secret Access Key [None]: PASTE_SECRET_KEY_HERE
Default region name [None]: us-east-1
Default output format [None]: json
```

---

## Test the configured identity

```bash
aws sts get-caller-identity
```

The response should identify the intended AWS account and IAM user. Do not paste credentials into the response, terminal logs, or project files.

---

After the identity check succeeds, use the established deployment workflow such as `deploy-s3.bat`.
