import sys
import json
import pathlib
import mimetypes
import boto3

# Reusable R2 uploader -- reads credentials from a file OUTSIDE any git repo
# (see the path below), so nothing secret ever touches version control.
# Usage: python upload_to_r2.py <local_dir> <r2_key_prefix>
CREDS_PATH = pathlib.Path(r"C:\Users\Vismit111\Desktop\Игра\.r2-credentials.json")
# Python's mimetypes doesn't know this one out of the box -- without it,
# uploaded .apk files got no Content-Type at all.
mimetypes.add_type("application/vnd.android.package-archive", ".apk")


def main() -> None:
    if len(sys.argv) != 3:
        print("usage: upload_to_r2.py <local_dir> <r2_prefix>")
        sys.exit(1)
    local_dir = pathlib.Path(sys.argv[1])
    prefix = sys.argv[2].strip("/")
    creds = json.loads(CREDS_PATH.read_text(encoding="utf-8"))
    s3 = boto3.client(
        "s3",
        endpoint_url=creds["endpoint_url"],
        aws_access_key_id=creds["access_key_id"],
        aws_secret_access_key=creds["secret_access_key"],
        region_name="auto",
    )
    bucket = creds["bucket"]
    for path in sorted(local_dir.rglob("*")):
        if path.is_file():
            key = f"{prefix}/{path.relative_to(local_dir).as_posix()}"
            content_type, _ = mimetypes.guess_type(path.name)
            extra = {"ContentType": content_type} if content_type else {}
            print(f"uploading {path.name} -> s3://{bucket}/{key}")
            s3.upload_file(str(path), bucket, key, ExtraArgs=extra)
    print("done")


if __name__ == "__main__":
    main()
