package com.yuvan.busbooking.common.util;

import tools.jackson.core.JsonParser;
import tools.jackson.databind.DeserializationContext;
import tools.jackson.databind.ValueDeserializer;

import java.nio.charset.StandardCharsets;
import java.util.Base64;

public class Base64Deserializer
        extends ValueDeserializer<String> {

    @Override
    public String deserialize(
            JsonParser parser,
            DeserializationContext context
    ) {

        String encoded = parser.getString();

        try {
            String decoded = new String(
                Base64.getDecoder().decode(encoded),
                StandardCharsets.UTF_8
        );

            return decoded;

        } catch (IllegalArgumentException e) {
            throw context.weirdStringException(
                    encoded,
                    String.class,
                    "Invalid Base64 password"
            );
        }
    }
}