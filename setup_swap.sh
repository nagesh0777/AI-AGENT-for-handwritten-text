#!/bin/bash

# Check if swap file already exists
if [ -f /swapfile ] || [ -f /swapfile.img ]; then
    echo "Swap file already exists."
else
    echo "Creating 4GB swap file..."
    sudo fallocate -l 4G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    echo "Swap created successfully."
fi

# Verify
sudo swapon --show
free -h
