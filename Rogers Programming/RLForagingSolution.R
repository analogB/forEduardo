
valueF_2mineadp<- function(nper,pMine0,N){
  
    #### PROBLEM DESCRIPTION ####
    # The Two Mine Problem:
    # Two types of mines exist: gold mines and diamond mines. Gold mines contain only dirt and gold. 
    # Diamond mines contain dirt, gold, and diamonds. Dirt is worthless, gold is valuable, and diamand
    # is more valuable. The distribution of minerals in gold mines and in diamond mines is known.
    # Minerals are distributed randomly in every mine. A mine is generated randomly from one of the two mine 
    # type distributions. The subject may choose to 1) create a new mineshaft in the mine, randomly revealing a  
    # mineral, or 2) extract minerals from the best existing mineshaft. Mineshafts cannot be exhausted.
    # The mineral distribution of the mine types and the value of minerals may be defined to produce distinct 
    # optimal strategies for each mine type. The information gained by creating new mineshafts will influence
    # estimates of the mine type, which will influence decision optimality.
    
    # Our question is whether subjects' decision procedures:
    # 1) neglect observations in updating the probability of the mine type, or
    # 2) update the probability of mine type based on observations, but neglect the expectation that future observation will provide informational value, or
    # 3) update the probability of mine type based on observation, and account for the expectation that future observations will help indicate the mine type
    
    # This function estimates the Value Function for the Two Mine Problem associated with decision procedure (3).
    # It applies a double-pass approximate dynamic programming technique that iterates the value function over a
    # sample of mineral paths based on the belief at the time of the decision, while updating the belief using MCMC sampling over
    # the decision paths.
  
    #nper is the number of decision periods
    #pMine0 is the prior probability of receiving a gold-type mine
    #N is the number of iterations for the RL loop

    #### PACKAGES #### 
    require(rjags)
  
    #### INITIATION ####
    # Trials & Timesteps
    #N           <- 10000 #number of samples including 1 additional for initiation #initialize with functin call
    #nper        <- 20  #number of timesteps including 1 additional for termination #initialize with functin call
    
    # Names
    trials        <- seq(1:N)
    time          <- seq(1,nper)
    mines         <- c('goldMine','diamondMine')
    minerals      <- c('dirt','gold','diamond','none')
    optns         <- c('newShaft','bestShaft')
    
    # Lengths
    df            <- 1
    nActions      <- length(optns)
    nStates       <- length(minerals)
    nMines        <- length(mines)

    #### REWARD STRUCTURE ####
    # Reward
    reward                      <- array(0,dim=c(nActions,nStates),       dimnames=list(Option=optns,Mineral=minerals))
    reward['newShaft',]         <- c(0,0,0,0)
    reward['bestShaft',]        <- c(0,1,10,0)

    # Ranking
    rank                        <- array(0,dim=c(nActions,nStates),       dimnames=list(Option=optns,Mineral=minerals))
    for (option in optns){
        rank[option,]           <- order(reward[option,],decreasing=TRUE)
    }

    #### TRANSITION PROBABILITIES ####
    sampleProb                  <- array(0,dim=c(nMines,nStates), dimnames=list(Mine=mines,Mineral=minerals))
    sampleProb['goldMine',]     <- c(0.8,0.2,0.0,0) #sum to 1
    sampleProb['diamondMine',]  <- c(0.6,0.35,0.05,0) #sum to 1
    
    transProb <- array(0,dim=c(nMines,nActions,nStates,nStates), dimnames=list(Mine=mines,Option=optns,MineralFm=minerals,MineralTo=minerals))
    
    for (i in 1:nMines){
      for (j in 1:nStates){
        transProb[i,'newShaft',rank['bestShaft',j],rank['bestShaft',]==j] <- sum(sampleProb[i,rank['bestShaft',]>=j])
        transProb[i,'newShaft',rank['bestShaft',j],rank['bestShaft',]< j] <- sampleProb[i,rank['bestShaft',]<j]
        transProb[i,'bestShaft',j,j]=1
      }
    }
    
    #### FUNCTIONS #### 
    v2a <- function(vect){
      v <- array(0,dim=c(nActions,nStates),dimnames=list(optns,minerals))
      for (i in 1:nActions){v[i,]<-vect}
      return(v)
    }
    best_mineral <- function(rnk,previous,new){
      as.integer(which(rnk==min(rnk[previous],rnk[new])))
    }
    update_p <- function(dat,prior,sampleProbs){
      sink('/dev/null') #supress all output
      dataList    <- list(dat = dat, prior = prior, probs = unname(sampleProbs), sampleSize = length(dat))
      modelString = "
      model{
      for (i in 1:sampleSize){
      dat[i] ~ dcat(probs[mine+1,])
      }
      mine ~ dbern(prior)
      }"
      writeLines(modelString, con="TEMPmodel.txt")
      
      jagsModel   <- jags.model("TEMPmodel.txt", data=dataList,  n.chains=1, n.adapt=100)
      codaSamples <- as.matrix(coda.samples(jagsModel, variable.names=c('mine'), n.iter=100 , thin=1))
      p           <- sum(array(codaSamples))/length(codaSamples)
      sink() #terminate output supression
      return(p)
    } 
    
    #### FORWARD ADP FINITE HORIZON SOLUTION for VALUE FUNCTION ####   
    # 2007 Powell ADP p274: First pass forward
    
    # Initialize Parameters
    state0            <- 4
    #pMine0            <- 0.5 initialize with functin call
    a                 <- 10 #harmonic constant for stepsize
    
    # Create Trial Loopers
    V                 <- array(0,dim=c(N,nStates,nper),       dimnames=list(Trial=trials,Mineral=minerals,Time=time))
    vCurrent          <- array(0,dim=c(N,nStates,nper),       dimnames=list(Trial=trials,Mineral=minerals,Time=time))
    s                 <- array(0,dim=c(N,nper),               dimnames=list(Trial=trials,Time=time))
    p                 <- array(0,dim=c(N,nper),               dimnames=list(Trial=trials,Time=time))
    sampleMine        <- array(0,dim=c(N),                    dimnames=list(Trial=trials))
    sampleMineral     <- array(0,dim=c(N,nper),               dimnames=list(Trial=trials,Time=time))
    choice            <- array(0,dim=c(N,nper),               dimnames=list(Trial=trials,Time=time))
    count             <- array(0,dim=c(nStates,nper),         dimnames=list(Mineral=minerals,Time=time))    
    stepsize          <- array(0,dim=c(N,nper),               dimnames=list(Trial=trials,Time=time))    


    # Loop over samples
    for (n in 2:N){
        # Generate sample path
        sampleMine[n]         <- rbinom(1,1,pMine0) + 1
        sampleMineral[n,]     <- apply(rmultinom(nper,1,sampleProb[sampleMine[n],]),2,which.max)
        
        #Initialize Time Parameters
        s[n,1]                <- state0
        p[n,1]                <- pMine0
        #V[n,,1]              <- reward['bestShaft',] 
        
        # Create Time Loopers
        vState                <- array(0,dim=c(nActions),             dimnames=list(Option=optns))
        vContribution         <- array(0,dim=c(nActions),             dimnames=list(Option=optns))
        voptns                <- array(0,dim=c(nActions),             dimnames=list(Option=optns))
        
        # Loop forward through time 
        for (t in 1:(nper-1)){
            # estimate transition probabilities based on beliefs
            pMine                 <- c(1-p[n,t],(p[n,t]))
            tP                    <- apply(transProb * pMine,c(2,3,4),sum)
      
            # estimate value of current state for each action   
            vState                <- apply((tP[,s[n,t],]*v2a(V[n-1,,t+1])),1,sum)
            vContribution         <- reward[,s[n,t]]
            voptns                <- vContribution + df*vState
            choice[n,t]           <- which.max(voptns)
            
            # update state
            sampleFilter          <- (seq(1,nper)<=t) & (choice[n,]==1)
            observations          <- sampleMineral[n,sampleFilter]
            
            if (choice[n,t]==1){
                s[n,t+1]          <- best_mineral(rank['bestShaft',],s[n,t],sampleMineral[n,t])
                p[n,t+1]          <- update_p(observations,pMine0,sampleProb) #bayesian update model
            } else {
                s[n,t+1]          <- s[n,t]
                p[n,t+1]          <- p[n,t]
            }
        }
        
        #Second pass backward through time
        for (t in (nper-1):1){
            # update value function
            vCurrent[n,s[n,t],t]  <- reward[choice[n,t],s[n,t]] + df*vCurrent[n,s[n,t+1],t+1]
            count[s[n,t],t]       <- count[s[n,t],t] + 1
            stepsize[n,t+1]       <- a/(a+count[s[n,t+1],t+1])
            V[n,,t+1]             <- V[n-1,,t+1]
            V[n,s[n,t+1],t+1]     <- (stepsize[n,t+1] * vCurrent[n,s[n,t+1],t+1]) + ((1-stepsize[n,t+1]) * V[n,s[n,t+1],t+1])
        }
    }     
    
    #### DIAGNOSTICS ####
    print(V[N,,])
    print(choice[N,])
    print(sampleMine[N])
    print(sampleMineral[N,])
    print(sampleFilter)
    print(observations)
    print(p[N,])
    
    #### RETURN ####
    return(V[N,,])      

}

X=valueF_2mineadp(20,0.5,10000)
