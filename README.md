# kubernetes
kubernetes and docker

define aliases to make life eaiser in ```~/.bash_profile``` by adding ```alias alias_name=full_command```

## docker

### create new container

from directory with Dockerfile
```docker build -t container_name```

### commands

- ```images```: list locally stored images
- ```inspect container_name```: JSON with info
- ```exec -it container_name bash```: running shell inside container. -it: STDIN open, pusedo terminal.
- ```ps```: list running containers
- ```stop``` and ```rm container_name```: stop and remove container.
- ```run -p 8080:8080 -d user/container_name```: run an image on a different machine on port 8080

### pushing to image registry
- ```docker tag image_name user/image_name```
- ```docker push user/image_name```


## creating simple kubernetes cluster with minikube

```minikube start```: sets up a single-node cluster for use in testing kubernetes and developing apps locally
```kubectl cluster-info```: display cluster and urls of kubernetes components
```kubectl ssh```: log into Minikube VM to explore processes running on the node

## kubectl
```alias k=kubect1```

### commands

-```get nodes```: list nodes
-```describe node [node_name]```: detailed information about single or all nodes. CPU and memory data, system information, containers running on the node and more.

