
####Optimal####
nper <- 20
df <- 1
nActions <- 2
nStates <- 4
state <- seq(1:nStates) #list of ranks

reward <- array(0,dim=c(nActions,nStates))
reward[2,] <- c(0,1,10,0)

zeros_1 <- array(0,dim=c(nStates))
zeros_2 <- array(0,dim=c(nActions,nStates))
zeros_3 <- array(0,dim=c(nActions,nStates,nStates))

rank <- zeros_2

for (i in 1:2){
  rank[i,] <- order(reward[i,],decreasing=TRUE)
}

#### FUNCTIONS ####
# Takes the probability of outcome i on 1 sample, the rank j of outcome i reward, and the number of samples. 
# Returns the probability that outcome i will be the best reward outcome after n samples (explore choices).
takeBestProb <- function(prb,rnk,n){
  tBP <- rep(0,length(rnk))
  for (j in 1:length(rnk)){
    tBP[rnk==j] <- (1-(sum(prb[rnk>j]))^n) - sum(tBP[rnk<j]) 
  }
  return(tBP)
}

# Takes the probability of outcome i, the rank of outcome i, and the best observed outcome.
# Returns the probability that outcome i will be the best observed outcome following a subsequent sample.
ratchet <- function(prb,rnk,nStates){
  out <- zeros_3
  for (i in 1:nStates){
    out[1,rnk[2,i],rnk[2,]==i] <- sum(prb[rnk[2,]>=i])
    out[1,rnk[2,i],rnk[2,]<i] <- prb[rnk[2,]<i]
    out[2,i,i]=1
  }
  return(out)
}

vect2arr <- function(vect){
  v <- zeros_2
  for (i in 1:nActions){
    v[i,]<-vect
  }
  return(v)
}

probs<-array(dim = c(2,4))
probs[1,]<-c(0.8,0.2,0,0)
probs[2,] <- c(0.6,0.35,0.05,0)
valueGold<-array(dim=c(2,nper+1))

for (i in 1:2){
  transProbs<-zeros_3
  transProbs<-ratchet(probs[i,],rank,nStates) #explore transistion probailities from [,i,] to [,,i]
  
  
  #### FINITE HORIZON BACKWARD SOLUTION ####
  v <-  array(0,dim=c(nStates,nper+1))
  vState <- zeros_2
  vContribution <- zeros_2
  value <- array(0,dim=c(nActions,nStates,nper))
  policy<- array(0,dim=c(nStates,nper))
  
  for (t in nper:1){
    for (s in 1:nStates){
      vState[,s] <- apply((transProbs[,s,]*vect2arr(v[,t+1])),1,sum)
      vContribution[,s] <- reward[,s]
      value[,s,t]<-vContribution[,s] + df*vState[,s]
      policy[s,t]<-which.max(value[,s,t])
      v[s,t] <- value[policy[s,t],s,t]
    }
  }
  valueGold[i,]<-v[2,]
}