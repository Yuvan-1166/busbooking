set -a
source .env
set +a

echo "Set .env Success"

./mvnw spring-boot:run   -Dspring-boot.run.jvmArguments="-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=*:5005"
