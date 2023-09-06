# APDrive - Google Drive like app built with Django and HDFS

This project is created as part of the course Distributed systems. Its built with Django and Hadoop HDFS. [WebHDFS](https://hadoop.apache.org/docs/stable/hadoop-project-dist/hadoop-hdfs/WebHDFS.html) is used to interact with HDFS. 
Current functionalities include:
- [x] User authentication system with custom user model
- [x] Create, open, rename, delete directories
- [x] Upload, download, rename, delete files

### Requirements
The Python requirements are stored in the requirements.txt file. They can be installed with pip:
```
python3 -m pip install -r requirements.txt
```
Hadoop should be installed and configured so WebHDFS is available. 
Celery is used for the user creation process. A Celery worker is also needed. To start Celery worker this command is used:
```
python3 -m celery -A apdrive worker
```
### Environment variables
Environment variables should be put in a .env file. These include the HADOOP_HOST and HADOOP_PORT variables.