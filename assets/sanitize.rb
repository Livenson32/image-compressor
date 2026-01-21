#!/usr/bin/env ruby

# frozen_string_literal: true

class ImageSanitizer
  require 'fileutils'

  def initialize(dir)
    @target = dir
    @count = 0

    clean_up
  end

  def clean_up
    # Removed space before ? so it's a method call, not a ternary
    unless File.directory?(@target)
      puts "[ERR]: #{@target} not a valid folder"
      return
    end

    puts "Starting Sanitizer"
    puts " Target: #{@target}"

    # grab all files w simple glob
    files = Dir.entries(@target).select { |f|
      File.file?(File.join(@target, f))
    }

    files.each do |old_name|
      # only allow alpha numeric chara, dots and dashes
      new_name = old_name.downcase.gsub(/[^0-9a-z.\-]/i, '_')

      if old_name != new_name
        begin
          File.rename(File.join(@target, old_name), File.join(@target, new_name))
          puts " [FIXED] #{old_name} to #{new_name}"
          @count += 1
        rescue => e
          puts " [ERR] Failed to rename #{old_name}: #{e.message}"
        end
      end
    end

    finish_report
  end

  def finish_report
    puts " Done, modified #{@count} files"
  end
end

# load script

path = ARGV[0] || './assets'
t1 = Time.now
ImageSanitizer.new(path)
t2 = Time.now
puts "  Took #{(t2 - t1).round(5)} seconds"
exit 0
