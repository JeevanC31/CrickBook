pipeline {
    agent any

    environment {
        // SonarQube configuration
        SONAR_HOST_URL = "http://16.113.14.173:9000/"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build CricBook Services') {
            steps {
                script {
                    echo "🛠️ Verification Build: Compiling and building services..."
                    
                    // We build the Docker images locally to verify code compiles correctly without errors.
                    // No registry pushes or deployments are performed.
                    
                    echo "📦 Building cricbook-next (Frontend)..."
                    sh "docker build -t cricbook-frontend:latest ./cricbook-next"

                    echo "📦 Building auth-service..."
                    sh "docker build -t cricbook-auth-service:latest ./services/auth-service"

                    echo "📦 Building turf-service..."
                    sh "docker build -t cricbook-turf-service:latest ./services/turf-service"

                    echo "📦 Building coach-service..."
                    sh "docker build -t cricbook-coach-service:latest ./services/coach-service"

                    echo "📦 Building match-service..."
                    sh "docker build -t cricbook-match-service:latest ./services/match-service"

                    echo "📦 Building shop-service..."
                    sh "docker build -t cricbook-shop-service:latest ./services/shop-service"

                    echo "📦 Building chat-service..."
                    sh "docker build -t cricbook-chat-service:latest ./services/chat-service"

                    echo "📦 Building admin-service..."
                    sh "docker build -t cricbook-admin-service:latest ./services/admin-service"
                    
                    echo "✅ Verification Build Completed Successfully!"
                }
            }
        }

        stage('SonarQube Quality Check') {
            steps {
                script {
                    echo "🔍 Running SonarQube Quality Analysis..."
                    
                    // Option A: Running via Docker scanner container using the provided token (isolated & self-contained)
                    // We inject the token using Jenkins credentials (stored as a secret text with ID 'sonar_token')
                    withCredentials([string(credentialsId: 'sonar_token', variable: 'SONAR_TOKEN')]) {
                        sh "docker run --rm -e SONAR_HOST_URL=${SONAR_HOST_URL} -e SONAR_TOKEN=${SONAR_TOKEN} -v \"\$(pwd):/usr/src\" sonarsource/sonar-scanner-cli"
                    }
                    
                    // Option B: Hardcoded token (Uncomment below and comment Option A if you haven't set up credentials in Jenkins yet)
                    // sh "docker run --rm -e SONAR_HOST_URL=${SONAR_HOST_URL} -e SONAR_TOKEN='sqa_c2ed2917bd23c71f66ac8f4dba26cd1d046e7ab5' -v \"\$(pwd):/usr/src\" sonarsource/sonar-scanner-cli"
                }
            }
        }
    }

    post {
        success {
            echo "✅ Pipeline completed successfully. Build validated and Quality Gate analysis submitted to SonarQube."
        }
        failure {
            echo "❌ Pipeline failed! Please check the logs above for build errors or static analysis failures."
        }
    }
}
