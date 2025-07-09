pipeline {
  agent any

  environment {
    IMAGE_NAME = 'docker.io/inteligeninfosys/credit-scoring-api'
    DOCKER_CREDENTIALS_ID = 'dockerhub-creds'  // Jenkins Docker credentials
  }

  stages {
    stage('Set Tag') {
            steps {
                script {
                    def timestamp = sh(script: "date +%Y%m%d%H%M%S", returnStdout: true).trim()
                    env.IMAGE_TAG = timestamp
                }
            }
    }

    stage('Checkout') {
      steps {
        echo "Checking out code..."
        checkout scm
      }
    }

    stage('Install Dependencies') {
      steps {
        echo "Installing Node.js dependencies..."
        sh 'npm install'
      }
    }

    stage('Test') {
      steps {
        echo "Running tests..."
        // Add real tests if you have them; placeholder for now
        sh 'echo "No tests yet"'
      }
    }

    stage('Build Docker Image') {
      steps {
        echo "Building Docker image..."
        sh "docker build -t $IMAGE_NAME:$IMAGE_TAG ."
      }
    }

    stage('Push to Docker Hub') {
      when {
        expression { return env.DOCKER_CREDENTIALS_ID }
      }
      steps {
        echo "Pushing Docker image to registry..."
        withCredentials([usernamePassword(
          credentialsId: env.DOCKER_CREDENTIALS_ID,
          usernameVariable: 'DOCKER_USER',
          passwordVariable: 'DOCKER_PASS'
        )]) {
          sh 'echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin'
          sh "docker push $IMAGE_NAME:$IMAGE_TAG"
        }
      }
    }

    stage('Deploy (Run Container)') {
      steps {
        echo "Running container locally for test..."
        sh "docker stop miniofiles || true && docker rm miniofiles || true"
        sh "docker run -d -p 4400:4400 --name miniofiles $IMAGE_NAME:$IMAGE_TAG"
      }
    }
  }

  post {
    success {
      echo 'Pipeline completed successfully!'
      echo "Image ${IMAGE_NAME}:${IMAGE_TAG} created and pushed successfully"
    }
    failure {
      echo 'Pipeline failed.'
    }
  }
}
