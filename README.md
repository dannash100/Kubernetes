# kubernetes-docker
kubernetes and docker notes and exercises following *Kubernetes in Action* Marko Luksa (Manning) 2017

define aliases to make life easier in ```~/.bash_profile``` by adding ```alias alias_name=full_command```

## docker

### create new container

from directory with Dockerfile
```docker build -t container_name```
```docker run --name container_name -p 8080:8080 -d kubia```

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

## kubernetes
```alias k=kubectl```

### creating simple kubernetes cluster with minikube

[minikube basics and commands](https://kubernetes.io/docs/tutorials/hello-minikube/)

```minikube start```: sets up a single-node cluster for use in testing kubernetes and developing apps locally
```minikube dashboard```: open GUI
```minikube service service_name```: access services through browser on minikube

### YAML descriptors
define kubernetes objects from YAML files.
```kubectl get pod pod_name -o yaml``` to view YAML of a deployed pod

- view guide template for creating manifests from scratch use explain: ```kubectl explain pods[.spec]```
- create from YAML or JSON: ```kubectl create -f pod_name.yaml```

**example of a basic pod manifest** ```pod_name.yaml```
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: kubia-manual
spec:
  containers:
  - image: luksa/kubia
    name: kubia
    ports:
    - containerPort: 8080
      protocol: TCP
```

port definition can be omitted as is purely informational.

### pods

- A group of related containers that will always run concurrently on the same worker node and in the same namespace. Each pod has its own IP, hostname, processes.
- pods allow for containers inside each group to share certain resources but not all, to achieve this Docker is configured to have all containers of a pod share the same set of Linux namespaces (shared hostname, network interfaces and IPC).
- containers in pods must make sure to not have port conflicts as they share a common port space.
- containers within pods can communicate through localhost
- communicate between separate pods and worker nodes with NAT-less network using the pods routable IP address
- pods are lightweight so dispersing apps into multiple pods is preferable, each one should contain only tightly related processes.
- example structure of a pod with a main container and supporting containers "the main container in a pod could be a web server that serves files from a certain file directory, while an additional container (a sidecar container) periodically downloads content from an external source and stores it in the web server’s directory."

### labels

- key-value pair you attach to a resource and then used when selecting resources using *label selectors*
example:
  - app: ui, which specifies which app, component, or microservice the pod belongs to.
  - rel: stable, which shows whether the application running in the pod is a stable, beta,
  or a canary release.
- defined in metadata portion of manifest
- can use multiple label selectors such as ```!label_name, label_name=val,```
- can use to categorize worker nodes using ```nodeSelector: condition: "true"``` part of the *spec* section deploy this pod only to nodes containing condition label.

### namespace

- ```get ns``` view ns in cluster
- see ```examples/custom-namespace.yaml``` then ```create -f``` it
- ```kubectl create -f pod_name.yaml -n custom-namespace``` to create into custom ns

### scheduling

- distributing pods between worker nodes.

### commands

- ```expose rc image_name --type=LoadBalencer --name image_name-http```: rc = replicationcontroller. creates service object
- ```get services```: list service objects
- ```get rc```: list replicationcontrollers
- ```cluster-info```: display cluster and urls of kubernetes components
- ```ssh```: log into Minikube VM to explore processes running on the node
- ```exec pod_name -- curl -s http://10.111.249.153```, ```exec pod_name env```: remotely run commands inside an existing container of a pod. examine contents, state and enviroment of a container. need to obtain the cluster IP of your service. Everything that follows the double dash will be executed inside the pod.
- ```exec -it pod_name bash```: run bash inside a pods container
- ```logs pod_name [-c container_name]```: retrieve logs *note: logs are rotated daily, every time the file reaches 10MB in size*
- ```port-forward pod_name 8888:8080``` & then ```curl localhost:8888```: connect to pod with port forwarding for debug
- ```get nodes```: list nodes
- ```get pods [-o wide]```: list pods, ?display IP and pods node
- ```describe [node | pod] [name]```: detailed information about single or all nodes. CPU and memory data, system information, containers running on the node and more.
- ```delete po [pod_name | -l label=val]``` delete pod by name or by label
- ```edit``` edit yaml definition in text-editor

## deploying managed pods

- to inspect a crashed pods log use ```logs mypod --previous``` & last state section in ```describe pod pod_name```
**exit codes 137 and 143** process killed/terminated by an external signal

### liveness probes
*find examples/liveness/kubia-liveness-probe.yaml*

- check to see if containers are alive
- assigned to container and then Kubernetes will periodically execute the probe and restart the container if it needs to.
- **HTTP GET probe** performs GET request on containers IP, port, path.
- **TCP Socket probe** tries to open a TCP connection on the port of a container
- **Exec probe** executes a command inside container and checks the commands exit status code.

### replication controllers

- makes sure there is always one instance of your pod running by replicating them
- if a pod was to break or be removed, the controller will make a new one to replace it.
- enables easy horizontal scaling
- RC's manage pods that match its label selector *see kubia-rc.yaml example*
- changing pod template will have no effect on the pods already defined, to modify them to need to delete them and let the rc replace them with new ones based on the new template.

### replica sets
*replace use of replication controllers and behave almost identically*

- usually not created directly, created automatically when creating higher-level deployment resource.
- more options with label selection - include a key regardless of value, or lack a label.
- following example requires the pod to contain a label with 'app' key and 'kubia' value
```yaml
selector:
  matchExpressions:
    - key: app
      operator: In
      values:
- kubia
```
- **operator** options = ```In, NotIn, Exists, DoesNotExist```

### deamon sets

- ensures a pod will run on each and every node. uses include log collecting and resource monitoring.

**horizontal scaling example**: ```scale rc image_name --replicas=3``` define desired pod instances

made up of 3 parts
1. a *label selector* determines what pods are in the RC's scope
2. a *replica count* specifies the desired number of pods to run
3. a *pod template* creates new replicas

### job resource
*see batch-job*

- run a pod whose container isn't restarted when the process running inside finished successfully.
- usage includes exporting large quantities of data and exporting it
- can set to run multiple completions and parallel operations. can be scaled in real-time with ```scale job job_name --replicas 3```
- limit job time with ```activeDeadlineSeconds``` in spec

### cron jobs

- batch jobs that run at a specific time in the future or repeatedly in specified intervals
- cron schedule format ```"0,5,15,30,45 * * * *"``` from left to right: ```min, hr, day of month, month, day of week``` in this case the job will run at 0, 15, 30 and 45 mins every hour of every day of every month on every day of the week.
- ```"0,30 * 1 * *"```: every 30 mins but only on first day of month, ```"0 3 * * 0"```: 3AM every Sunday

## exposing services internally and externally

### services

- there may be multiple pods that act as the frontend and a single backend database pod, this presents two problems
  1. external clients need to connect to frontend without needing to know the state or structure of the backend.
  2. front end pods need to connect to back end database which may move around a cluster over time and change IP.
- service object solves problem of ever-changing IPs of pods as they are created and disappear. It also exposes multiple pods at a single consistent IP and port pair
- Additionaly you can enable frontend pods to easily access backend service by name through environmental variables or DNS.
- each pod has its own IP address but it is internal to the cluster and not accessible, it can be exposed through the service object.
- services can be set to hit multiple ports

**LoadBalancer-type service**: an external load balancer that you can use to connect to a pod through its public IP.

#### endpoints

- endpoints sit between services and pods, a list of IP adresses and ports exposing a service.
- can be manually configured and updated manually. *see tools/external-service note: name of endpoint object must match service*
- contains a list of IPs that the service will forward connections to and a target port.
- can communicate with external resources in this way, outside of Kubernetes. *see tools/external-service-externalname* for externalName method


### DNS

- pods run a DNS server that all other pods in the cluster can access through its (FQDN), automaticly configured in ```/etc/resolv/conf```
- If running in a single namespace only ```http://service_name``` is required.

### nodeports

- set type in Services spec to NodePort to forward incoming connections to the pods that are part of the service.
- you will need to adjust the cloud platforms firewall to allow external connections on the node port
- then it will be accesible on ```<node IP>:<node port>```
